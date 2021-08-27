import ESBUILD from "esbuild";
import { scriptFiles as files, asyncForEach, watch, minify, error, compression } from "./Lib/helper.mjs";
import {
    browserlist,
    logLevel,
    legalComments,
    assignPlugin,
    writeFilesToAnotherPackage,
    importPlugins,
} from "./Lib/esbuildHelper.mjs";

async function build() {
    // Pre-import plugins
    const plugins = await importPlugins();
    await asyncForEach(files, async ({ entryPoints, sourcemap, outdir, format, external }) => {
        const jsExtension = format === "esm" ? ".mjs" : format === "cjs" ? ".cjs" : ".js";
        const firstOutdir = outdir[0];
        const multiplePackages = outdir.length > 1;
        const write = compression ? false : !multiplePackages;

        await ESBUILD.build({
            entryPoints,
            sourcemap,
            bundle: true,
            platform: "browser",
            format,
            minify,
            watch,
            external,
            write,
            logLevel,
            legalComments,
            target: browserlist,
            outdir: firstOutdir,
            outExtension: {
                ".js": jsExtension,
            },
            loader: {
                ".cjsx": "jsx",
                ".ctsx": "tsx",
                ".mjsx": "jsx",
                ".mtsx": "tsx",
            },
            plugins: (() => {
                let returnValue = [];
                const svelte = plugins.svelte;
                if (svelte?.plugin) {
                    returnValue.push(
                        svelte.plugin({
                            preprocess: svelte.preprocess(),
                            ...svelte.options,
                        })
                    );
                }

                for (const key in plugins) {
                    const entry = plugins[key];
                    if (key === "compress" || !entry.isStandardPlugin || !entry?.plugin) {
                        continue;
                    }
                    returnValue.push(entry.plugin(entry.options));
                }

                if (compression) {
                    returnValue.push(
                        plugins.compress({
                            onEnd: ({ outputFiles }) => {
                                if (multiplePackages) {
                                    // We skip the first entry with index = 1
                                    for (let index = 1; index < outdir.length; index++) {
                                        writeFilesToAnotherPackage(outputFiles, firstOutdir, outdir[index]);
                                    }
                                }
                            },
                        })
                    );
                }
                return returnValue;
            })(),
        })
            .then((result) => {
                if (!write && !compression) {
                    outdir.forEach((dir) => {
                        writeFilesToAnotherPackage(result.outputFiles, firstOutdir, dir);
                    });
                }
            })
            .catch(error);
    });
}

build();
