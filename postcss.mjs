import postcss from "postcss";
import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import readCache from "read-cache";
import { bold, dim, cyan, green } from "colorette";
import prettyHrtime from "pretty-hrtime";
import {
    files,
    watch,
    getAncestorDirs,
    dependencyGraph,
    dependencies,
    rebasePlugin,
    error,
    print,
    rc,
} from "./Lib/postcssHelper.mjs";

let configFile;

function renderFiles(keys) {
    if (typeof keys === "string") {
        keys = [keys];
    }
    if (!keys) {
        keys = Object.keys(files);
    }
    return Promise.all(
        keys.map((key) => {
            return readCache(key).then((content) => css(content, files[key]));
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
                    return renderFiles([...new Set(recompile)])
                        .then((results) => watcher.add(dependencies(results)))
                        .then(printMessage)
                        .catch(error);
                });
            }
        });
}

function css(css, file) {
    const time = process.hrtime();
    print(cyan(`Processing ${bold(file.from)}...`));
    return rc()
        .then((ctx) => {
            configFile = ctx.file;
            return postcss([rebasePlugin, ...ctx.plugins])
                .process(css, {
                    from: file.from,
                    to: file.to,
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
                    const tasks = [fs.outputFile(file.to, result.css)];
                    if (result.map) {
                        tasks.push(fs.outputFile(`${file.to}.map`, result.map.toString()));
                    }
                    return Promise.all(tasks).then(() => {
                        const prettyTime = prettyHrtime(process.hrtime(time));
                        print(green(`Finished ${bold(file.from)} in ${bold(prettyTime)}`));

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
