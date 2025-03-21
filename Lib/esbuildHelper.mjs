import { BROWSERLIST, fs } from "carbon-pipeline";
import { config, compression, dynamicImport, readFlowSettings, toArray, production, minify } from "./helper.mjs";

const browserlist = (() => {
    const SUPPORTED_BUILD_TARGETS = ["es", "chrome", "edge", "firefox", "ios", "node", "safari"];
    const GET_EVERY_TARGET = BROWSERLIST().reverse();
    const SEPERATOR = " ";
    const TARGETS = [];
    let singleTarget = "";
    let index = 0;

    for (const TARGET of GET_EVERY_TARGET) {
        for (const SELECTED_TARGET of SUPPORTED_BUILD_TARGETS) {
            if (TARGET.startsWith(SELECTED_TARGET + SEPERATOR) && !singleTarget.startsWith(SELECTED_TARGET)) {
                index++;
                singleTarget = TARGET.replace(SEPERATOR, "");
                TARGETS[index] = singleTarget;
            }
        }
        if (TARGET.startsWith("ie ")) {
            index++;
            TARGETS[index] = "es5";
        }
    }

    return TARGETS.filter(Boolean);
})();

function assignPlugin(obj, options) {
    const isStandardPlugin = Object.keys(obj).length === 1;
    if (!options || typeof options !== "object") {
        options = {};
    }
    return { ...obj, options, isStandardPlugin };
}

function copyFolderPlugin({ source, target }) {
    return {
        name: "copyFolder",
        async setup(build) {
            build.onEnd(async (result) => {
                await fs.ensureDir(target);
                await fs.copy(source, target);
            });
        },
    };
}

async function importPlugins() {
    const plugins = {
        copyFolder: copyFolderPlugin,
    };
    const esbuildPlugins = config.esbuild?.plugins;
    const additionalPlugins = config.esbuild?.additionalPlugins || [];

    if (compression) {
        plugins["compress"] = await dynamicImport("./compress.mjs", "esPlugin");
    }
    if (!esbuildPlugins && !additionalPlugins) {
        return plugins;
    }

    const sveltePlugin = esbuildPlugins?.svelte;
    if (sveltePlugin?.enable === true) {
        const plugin = await dynamicImport(esbuildPlugins.svelte.plugin);
        const preprocessName = esbuildPlugins.svelte.preprocess;
        const preprocess = preprocessName ? await dynamicImport(preprocessName) : null;
        plugins["svelte"] = assignPlugin(
            {
                plugin,
                preprocess,
                filterWarnings: sveltePlugin.filterWarnings,
            },
            sveltePlugin.options
        );
    }

    const vuePlugin = esbuildPlugins?.vue;
    if (vuePlugin?.enable === true) {
        const plugin = await dynamicImport(esbuildPlugins.vue.plugin);
        const options = { enableDevTools: !production, ...(vuePlugin.options || {}) };
        plugins["vue"] = assignPlugin(
            {
                plugin,
            },
            options
        );
    }

    for (const name in additionalPlugins) {
        const configuration = additionalPlugins[name];
        if (!configuration) {
            continue;
        }
        const importedPackage = await dynamicImport(name);
        const plugin = configuration.functionName ? importedPackage[configuration.functionName] : importedPackage;
        if (typeof plugin === "function") {
            plugins[name] = assignPlugin(plugin, configuration.options);
        }
    }

    const babelPlugin = esbuildPlugins?.babel;
    if (babelPlugin?.enable === true) {
        const plugin = await dynamicImport("esbuild-plugin-babel");
        plugins["babel"] = assignPlugin(
            {
                plugin,
            },
            babelPlugin.options
        );
    }

    const injectStylePlugin = esbuildPlugins?.injectStyle;
    if (injectStylePlugin?.enable === true) {
        const plugin = await dynamicImport("./injectStyle.mjs");
        const options = { minify, ...(injectStylePlugin.options || {}) };
        plugins["injectStyle"] = assignPlugin(
            {
                plugin,
            },
            options
        );
    }

    return plugins;
}

const options = config.esbuild?.options || {};
options.pure = toArray(config.esbuild?.options?.pure) || [];
options.logLevel = config.esbuild?.options?.logLevel || "info";
options.legalComments = config.esbuild?.options?.legalComments || "linked";

const flowSettings = readFlowSettings(config.esbuild.defineFlowSettings, config.esbuild.flowCommand);

export { browserlist, options, importPlugins, flowSettings };
