import ESBUILD from "esbuild";
import { deepmerge } from "carbon-pipeline";
import { scriptFiles as files, asyncForEach, watch, minify, compression, silent, production } from "./Lib/helper.mjs";
import { browserlist, options, importPlugins, flowSettings } from "./Lib/esbuildHelper.mjs";

async function build() {
    // Pre-import plugins
    const plugins = await importPlugins();
    await asyncForEach(files, async ({ entryPoints, sourcemap, outdir, format, external, inline, extension }) => {
        const firstOutdir = outdir[0];
        const multiplePackages = outdir.length > 1;
        const write = !compression || inline;

        let additionlOptionsForSvelte = {};
        if (plugins?.svelte?.plugin) {
            additionlOptionsForSvelte = {
                mainFields: ["svelte", "browser", "module", "main"],
                conditions: ["svelte", "browser", "default", "import", "module"],
            };
        }

        if (silent) {
            options.logLevel = "silent";
        }

        if (inline) {
            options.legalComments = "none";
        }

        const esOptions = {
            ...additionlOptionsForSvelte,
            ...options,
            entryPoints,
            sourcemap,
            bundle: true,
            platform: "browser",
            format,
            minify,
            external,
            write,
            target: browserlist,
            outdir: firstOutdir,
            outExtension: {
                ".js": extension,
            },
            define: {
                ...flowSettings,
                "process.env.npm_package_version": '"' + process.env.npm_package_version + '"',
            },
            loader: {
                ...options.loader,
                ".cjsx": "jsx",
                ".ctsx": "tsx",
                ".mjsx": "jsx",
                ".mtsx": "tsx",
            },
            plugins: (() => {
                let returnValue = [];
                const svelte = plugins.svelte;
                if (svelte?.plugin) {
                    const filterWarnings = {
                        code: [],
                        filenameStartsWith: [],
                    };
                    if (svelte?.filterWarnings?.code) {
                        const obj = svelte.filterWarnings.code;
                        for (const key in obj) {
                            if (obj[key]) {
                                filterWarnings.code.push(key);
                            }
                        }
                    }
                    if (svelte?.filterWarnings?.filenameStartsWith) {
                        const obj = svelte.filterWarnings.filenameStartsWith;
                        for (const key in obj) {
                            if (obj[key]) {
                                filterWarnings.filenameStartsWith.push(key);
                            }
                        }
                    }

                    const svelteOptions = deepmerge({ compilerOptions: { dev: !production } }, svelte.options);

                    returnValue.push(
                        svelte.plugin({
                            preprocess: svelte.preprocess(),
                            ...svelteOptions,
                            filterWarnings: (warning) => {
                                let returnValue = true;

                                filterWarnings.code.forEach((code) => {
                                    if (warning.code === code) {
                                        returnValue = false;
                                    }
                                });

                                filterWarnings.filenameStartsWith.forEach((startsWith) => {
                                    if (warning.filename.startsWith(startsWith)) {
                                        returnValue = false;
                                    }
                                });

                                return returnValue;
                            },
                        })
                    );
                }

                for (const key in plugins) {
                    const entry = plugins[key];
                    if (key === "compress" || key === "copyFolder" || !entry.isStandardPlugin || !entry?.plugin) {
                        continue;
                    }
                    returnValue.push(entry.plugin(entry.options));
                }

                if (compression && !inline) {
                    returnValue.push(plugins.compress());
                }

                if (multiplePackages) {
                    const source = firstOutdir;
                    // We skip the first entry with index = 1
                    for (let index = 1; index < outdir.length; index++) {
                        const target = outdir[index];
                        returnValue.push(plugins.copyFolder({ source, target }));
                    }
                }

                return returnValue;
            })(),
        };

        if (watch) {
            const context = await ESBUILD.context(esOptions);
            // Enable watch mode
            await context.watch();
        } else {
            await ESBUILD.build(esOptions);
        }
    });
}

build();
