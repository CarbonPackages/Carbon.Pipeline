import postcss from "postcss";
import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import readCache from "read-cache";
import { bold, dim, cyan, magenta } from "colorette";
import {
    styleFiles as files,
    watch,
    error,
    dynamicImport,
    compression,
    print,
    sass,
    sassFileCheck,
    humanFileSize,
    humanDuration,
    equalArrays,
} from "./Lib/helper.mjs";
import { getAncestorDirs, dependencyGraph, dependencies, rc } from "./Lib/postcssHelper.mjs";

let configFile;
let compressFunction = compression ? await dynamicImport("./compress.mjs", null) : {};
let sassFunction = sass ? await dynamicImport("./sass.mjs", null) : {};
let { writeBr, writeGz } = compressFunction;
let outputLength = 0;

function renderFiles(keys) {
    if (typeof keys === "string") {
        keys = [keys];
    }
    if (!keys) {
        keys = Object.keys(files);
    }

    return Promise.all(
        keys.map((key) => {
            return readCache(key).then((content) => {
                const time = process.hrtime();
                const file = files[key];
                outputLength = Math.max(outputLength, file.length);

                if (file.sass) {
                    const result = sassFunction.render(key);
                    files[key].importedFiles = result.importedFiles;
                    content = result.css;
                }
                return css(content, file, time);
            });
        })
    );
}

function build() {
    Promise.resolve()
        .then(() => {
            return renderFiles();
        })
        .then((results) => {
            if (watch) {
                const input = results.map((result) => path.resolve(result.opts.from));
                const printMessage = () => print(dim("\nWaiting for file changes..."));
                printMessage();
                const watcher = chokidar.watch(input.concat(dependencies(results)), {
                    awaitWriteFinish: {
                        stabilityThreshold: 50,
                        pollInterval: 10,
                    },
                });

                // Add files from sass
                const importedFiles = files[input].importedFiles;
                let importedFilesLength = importedFiles?.length || 0;

                if (importedFilesLength) {
                    watcher.add(importedFiles);
                }

                if (configFile) {
                    watcher.add(configFile);
                }
                watcher.on("ready", printMessage).on("change", (file) => {
                    let recompile = [];
                    if (input.includes(file)) {
                        recompile.push(file);
                    }
                    const dependants = dependencyGraph
                        .dependantsOf(file)
                        .concat(getAncestorDirs(file).flatMap(dependencyGraph.dependantsOf));
                    recompile = recompile.concat(dependants.filter((file) => input.includes(file)));
                    if (!recompile.length) {
                        recompile = input;
                    }

                    // Add new files from sass
                    const importedFiles = files[input].importedFiles;
                    if (importedFilesLength < importedFiles?.length) {
                        importedFilesLength = importedFiles.length;
                        watcher.add(importedFiles);
                    }

                    return renderFiles([...new Set(recompile)])
                        .then((results) => watcher.add(dependencies(results)))
                        .then(printMessage)
                        .catch(error);
                });
            }
        });
}

function css(css, file, time) {
    return rc()
        .then((ctx) => {
            configFile = ctx.file;
            return postcss(ctx.plugins)
                .process(css, {
                    from: file.from,
                    to: file.to[0],
                    map: file.sourcemap
                        ? {
                              absolute: false,
                              inline: false,
                              sourcesContent: true,
                          }
                        : null,
                    ...(ctx.options || {}),
                })
                .then((result) => {
                    const tasks = [];
                    // This fixes url done with resolve()
                    result.css = result.css.replace(
                        /(\/_Resources\/Static\/Packages\/[\w]+\.[\w]+\/)Resources\/Public\//g,
                        "$1"
                    );

                    const cssFilesize = humanFileSize(result.css.length);
                    let mapFilesize = 0;
                    file.to.forEach((to, index) => {
                        tasks.push(fs.outputFile(to, result.css));
                        if (compression) {
                            tasks.push(writeGz(to, result.css));
                            tasks.push(writeBr(to, result.css));
                        }
                        if (result.map) {
                            const file = `${to}.map`;
                            const map = result.map.toString();
                            tasks.push(fs.outputFile(file, map));
                            if (!watch && index === 0) {
                                const size = fs.statSync(file)?.size;
                                mapFilesize = humanFileSize(size);
                            }
                            if (compression) {
                                tasks.push(writeGz(file, map));
                                tasks.push(writeBr(file, map));
                            }
                        }
                    });
                    return Promise.all(tasks).then(() => {
                        const fileOuput = file.to[0];
                        const outputFilename = path.join(path.dirname(fileOuput), bold(path.basename(fileOuput)));
                        const spaces = " ".repeat(outputLength - fileOuput.length);
                        const duration = watch ? "  " + magenta(humanDuration(process.hrtime(time))) : "";
                        print(`  ${outputFilename}     ${spaces} ${cyan(cssFilesize) + duration}`);
                        if (mapFilesize) {
                            print(`  ${outputFilename}${bold(".map")} ${spaces} ${cyan(mapFilesize)}`);
                        }

                        result.warnings().forEach((warn) => {
                            print(warn.toString());
                        });

                        return result;
                    });
                });
        })
        .catch((err) => {
            throw err;
        });
}

build();
