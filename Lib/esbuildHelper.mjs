import BROWSERLIST from "browserslist";
import fs from "fs-extra";
import { config, compression, dynamicImport, readFlowSettings, toArray } from "./helper.mjs";

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

function writeFilesToAnotherPackage(outputFiles, baseDir, newDir) {
    outputFiles.forEach(({ path, contents }) => {
        path = path.replace(baseDir, newDir);
        fs.outputFile(path, contents);
    });
}

async function importPlugins() {
    const plugins = {};
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

    return plugins;
}

const options = config.esbuild?.options || {};
options.pure = toArray(config.esbuild?.options?.pure) || [];
options.logLevel = config.esbuild?.options?.logLevel || "info";
options.legalComments = config.esbuild?.options?.legalComments || "linked";

const flowSettings = readFlowSettings(config.esbuild.defineFlowSettings);

export { browserlist, options, writeFilesToAnotherPackage, importPlugins, flowSettings };
