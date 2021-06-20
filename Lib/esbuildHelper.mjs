import BROWSERLIST from "browserslist";
import { asyncForEach, scriptFiles, watch, minify, error, config } from "./helper.mjs";

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

const esbuildConfig = config.esbuild;

async function dynamicImport(name) {
    const dynamicImport = await import(name);
    return dynamicImport.default;
}

export { browserlist, scriptFiles as files, asyncForEach, watch, minify, error, dynamicImport, esbuildConfig };
