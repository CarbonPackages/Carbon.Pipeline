import { config, production } from "./helper.mjs";
import { execSync } from "child_process";

const esbuildConfig = config.esbuild;

export default readEnvVariables();

function readEnvVariables() {
    let variables = esbuildConfig?.defineEnvVariables;
    // Nothing set, do noting
    if (!variables) {
        return null;
    }

    // Check if settings are correct
    if (typeof variables === "string") {
        variables = [variables];
    }
    const isArray = Array.isArray(variables) && variables.length && variables.every((string) => typeof string === "string");
    if (!isArray) {
        error("The settings defineEnvVariables must a string or an array of strings");
        return null;
    }

    // Unique variables
    variables = [...new Set(variables)];

    let define = {};
    variables.forEach((variable) => {
        const result = execSync(`echo $${variable}`).toString("utf8");
        define[`ENV.${variable}`] = `"${result.trim()}"`;
    });

    return define;
}
