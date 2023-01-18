import ESBUILD from "esbuild";
import { scriptFiles as files, asyncForEach, watch, minify, compression } from "./Lib/helper.mjs";
import { browserlist, options, importPlugins, flowSettings } from "./Lib/esbuildHelper.mjs";

async function build() {
    // Pre-import plugins
    const plugins = await importPlugins();
    await asyncForEach(files, async ({ entryPoints, sourcemap, outdir, format, external, inline, extension }) => {
        const firstOutdir = outdir[0];
        const multiplePackages = outdir.length > 1;
        const write = !compression || inline;

        const esOptions = {
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
                    returnValue.push(
                        svelte.plugin({
                            preprocess: svelte.preprocess(),
                            ...svelte.options,
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
