import ESBUILD from "esbuild";
import {
    browserlist,
    asyncForEach,
    files,
    watch,
    minify,
    error,
    dynamicImport,
    esbuildConfig,
} from "./Lib/esbuildHelper.mjs";

function assignPlugin(obj, options) {
    if (typeof options !== "object") {
        options = {};
    }
    return { ...obj, ...options };
}

async function importPlugins() {
    const esbuildPlugins = esbuildConfig?.plugins;
    if (!esbuildPlugins) {
        return {};
    }
    const plugins = {};

    const sveltePlugin = esbuildPlugins?.svelte;
    if (sveltePlugin?.enable === true) {
        const plugin = await dynamicImport("esbuild-svelte");
        const preprocess = await dynamicImport("svelte-preprocess");
        plugins["svelte"] = assignPlugin(
            {
                plugin,
                preprocess,
            },
            sveltePlugin.options
        );
    }

    const vuePlugin = esbuildPlugins?.vue;
    if (vuePlugin?.enable === true) {
        const plugin = await dynamicImport("esbuild-vue");
        plugins["vue"] = assignPlugin(
            {
                plugin,
            },
            vuePlugin.options
        );
    }

    return plugins;
}

async function build() {
    // Pre-import plugins
    const plugins = await importPlugins();
    await asyncForEach(files, async ({ entryPoints, sourcemap, outdir, format }) => {
        await ESBUILD.build({
            entryPoints,
            sourcemap,
            bundle: true,
            platform: "browser",
            outdir,
            format,
            minify,
            watch,
            target: browserlist,
            logLevel: esbuildConfig.logLevel || "info",
            legalComments: esbuildConfig.legalComments || "linked",
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
                const vue = plugins.vue;
                if (vue?.plugin) {
                    returnValue.push(vue.plugin(vue.options));
                }
                return returnValue;
            })(),
        }).catch(error);
    });
}

build();
