import BROWSERLIST from "browserslist";
import fs from "fs-extra";
import { config, scriptFiles, compression, dynamicImport } from "./helper.mjs";

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
    }

    return TARGETS.filter(Boolean);
})();

function assignPlugin(obj, options) {
    if (typeof options !== "object") {
        options = {};
    }
    return { ...obj, ...options };
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

    if (compression) {
        plugins["compress"] = await dynamicImport("./compress.mjs", "esPlugin");
    }
    if (!esbuildPlugins) {
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

    return plugins;
}

const logLevel = config.esbuild?.logLevel || "info";
const legalComments = config.esbuild?.legalComments || "linked";

export {
    browserlist,
    scriptFiles as files,
    logLevel,
    legalComments,
    assignPlugin,
    writeFilesToAnotherPackage,
    importPlugins,
};
