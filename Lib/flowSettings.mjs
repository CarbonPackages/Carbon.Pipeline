import { yaml, red } from "carbon-pipeline";
import { config, production } from "./helper.mjs";
import { execSync } from "child_process";

const esbuildConfig = config.esbuild;

export default readFlowSettings();

function readFlowSettings() {
    let paths = esbuildConfig?.defineFlowSettings;
    // Nothing set, do noting
    if (!paths) {
        return null;
    }

    // Check if settings are correct
    const isString = typeof paths === "string";
    const isArray = Array.isArray(paths) && paths.length && paths.every((path) => typeof path === "string");
    if (paths === true || !(isString || isArray)) {
        error("The settings defineFlowSettings must a string or an array of strings");
        return;
    }

    const config = esbuildConfig?.flowCommand;

    // Check if ddev is set
    let prefix = "";
    if (config?.ddevCheck) {
        try {
            execSync(config.ddevCheck);
            prefix = "ddev exec";
        } catch (error) {}
    }

    // Settings is a single value
    if (isString) {
        return readPath(config, prefix, paths);
    }

    // Unique paths
    paths = [...new Set(paths)];

    let define = {};
    paths.forEach((path) => {
        define = {...define, ...readPath(config, prefix, path)};
    });

    return define;
}

function execCommand(command, prefix, path, emptyMessage) {
    prefix = prefix && typeof prefix === "string" ? prefix + " " : "";
    const result = execSync(`${prefix}${command} --path ${path}`).toString("utf8");
    if (result.includes(emptyMessage)) {
        return emptyMessage;
    }
    return result.replace(`Configuration "Settings: ${path}":`, "").trim();
}

function readPath(config, prefix, path) {
    const emptyMessage = `Configuration "Settings: ${path}" was empty!`;
    let settings = emptyMessage;
    if (production) {
        settings = execCommand(config.production, prefix, path, emptyMessage);
    }
    if (settings === emptyMessage) {
        settings = execCommand(config.development, prefix, path, emptyMessage);
    }
    if (settings === emptyMessage) {
        error(emptyMessage);
    }
    const json = yaml.load(settings, { schema: yaml.JSON_SCHEMA, json: true });
    return convertJsonForDefine(json, path);
}

function error(message) {
    console.error("\n");
    console.error(red(` ${message} `));
    console.error("\n");
    process.exit(1);
}

function convertJsonForDefine(json, prefix) {
    const define = {};
    const objects = {};

    const isKeyedObject = (value) => {
        if (typeof value !== "object" && value !== null) {
            return false;
        }
        return !Array.isArray(value);
    }

    const replaceIdentifier = (identifier) =>
        identifier
            .replace(/\.\./g, ".")
            .replace(/-/g, "_")
            .replace(/0/g, "ZERO")
            .replace(/1/g, "ONE")
            .replace(/2/g, "TWO")
            .replace(/3/g, "THREE")
            .replace(/4/g, "FOUR")
            .replace(/5/g, "FIVE")
            .replace(/6/g, "SIX")
            .replace(/7/g, "SEVEN")
            .replace(/8/g, "EIGHT")
            .replace(/9/g, "NINE");

    const checkIdentifier = (identifier) => !identifier.match(/[:\d\/\+\$\\\*\[\]]/gi);
    const flatten = (identifier, value) => {
        const keyedObject = isKeyedObject(value);
        if (typeof value !== "object" && value !== null) {
           identifier = replaceIdentifier(identifier);
        }

        if (!checkIdentifier(identifier)) {
            return;
        }

        define["FLOW." + prefix + identifier] = JSON.stringify(value);

        if (keyedObject) {
            for (const key in value) {
                flatten(`${identifier}.${key}`, value[key]);
            }
        }
    };

    if (!isKeyedObject(json)) {
        flatten("", json);
        return define;
    }

    prefix = prefix && typeof prefix === "string" ? prefix + "." : "";
    for (const key in json) {
        flatten(key, json[key]);
    }

    return define;
}
