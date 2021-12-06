import postcss from "postcss";
import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import readCache from "read-cache";
import { bold, dim, cyan, magenta } from "nanocolors";
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

function getImportedSaasFiles(inputs, entries) {
    if (!entries) {
        entries = [];
    }
    let hasNew = true;
    const currentFiles = [...entries];

    inputs.forEach((input) => {
        const entry = files[input];
        if (entry.sass) {
            entries = entries.concat(entry.importedFiles);
        }
    });
    entries = [...new Set(entries.filter((file) => !!file))];

    if (equalArrays(currentFiles, entries)) {
        hasNew = false;
    }

    return { entries, hasNew };
}

function build() {
    Promise.resolve()
        .then(() => {
            return renderFiles();
        })
        .then((results) => {
            if (watch) {
                const inputs = results.map((result) => path.resolve(result.opts.from));
                const watcher = chokidar.watch(inputs.concat(dependencies(results)), {
                    awaitWriteFinish: {
                        stabilityThreshold: 50,
                        pollInterval: 10,
                    },
                });

                // Add files from sass
                let importedSaasFiles = [];
                if (sass) {
                    const { entries } = getImportedSaasFiles(inputs);
                    if (entries.length) {
                        importedSaasFiles = entries;
                        watcher.add(entries);
                    }
                }

                print(dim("\nWaiting for file changes..."));
                watcher.on("change", (file) => {
                    const isSassFile = sassFileCheck(file);
                    let recompile = [];
                    if (inputs.includes(file)) {
                        recompile.push(file);
                    }
                    let dependants = [];
                    if (isSassFile) {
                        const { entries, hasNew } = getImportedSaasFiles(inputs, importedSaasFiles);
                        if (entries.length) {
                            if (hasNew) {
                                // Add new files from sass
                                importedSaasFiles = entries;
                                watcher.add(entries);
                            }
                            for (const input in files) {
                                const entry = files[input];
                                if (entry.sass && entry.importedFiles.includes(file)) {
                                    recompile.push(input);
                                }
                            }
                        }
                    } else {
                        dependants = dependencyGraph
                            .dependantsOf(file)
                            .concat(getAncestorDirs(file).flatMap(dependencyGraph.dependantsOf));
                        recompile = recompile.concat(dependants.filter((file) => inputs.includes(file)));
                    }

                    if (!recompile.length) {
                        recompile = inputs;
                    }

                    return renderFiles([...new Set(recompile)])
                        .then((results) => watcher.add(dependencies(results)))
                        .catch(error);
                });
            }
        });
}

function css(css, file, time) {
    return rc()
        .then((ctx) => {
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
                        if (compression && !file.inline) {
                            tasks.push(writeGz(to, result.css));
                            tasks.push(writeBr(to, result.css));
                        }
                        if (result.map) {
                            const file = `${to}.map`;
                            const map = result.map.toString();
                            tasks.push(
                                fs.outputFile(file, map, () => {
                                    if (!watch && index === 0) {
                                        const size = fs.statSync(file)?.size;
                                        mapFilesize = humanFileSize(size);
                                    }
                                })
                            );

                            if (compression) {
                                tasks.push(writeGz(file, map));
                                tasks.push(writeBr(file, map));
                            }
                        }
                    });
                    return Promise.all(tasks).then(() => {
                        const fileOuput = file.to[0];
                        const outputFilename = path.join(path.dirname(fileOuput), bold(path.basename(fileOuput)));
                        const spaces = " ".repeat(Math.max(outputLength - fileOuput.length, 0));
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
