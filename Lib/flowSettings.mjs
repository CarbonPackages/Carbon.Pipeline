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
        const json = readSettings(config, prefix, paths);
        return convertJsonForDefine(json, paths);
    }

    // Unique paths
    paths = [...new Set(paths)];

    // Read all settings
    const json = readSettings(config, prefix);
    let define = {};
    paths.forEach((path) => {
        const data = getFromPath(json, path);
        if (data === undefined) {
            error(getEmptyMessage(path));
        }
        define = { ...define, ...convertJsonForDefine(data, path) };
    });

    return define;
}

function execCommand(command, prefix, path, emptyMessage) {
    prefix = prefix && typeof prefix === "string" ? prefix + " " : "";
    const commandPath = path && typeof path === "string" ? ` --path ${path}` : "";

    const result = execSync(`${prefix}${command}${commandPath}`).toString("utf8");

    if (result.includes(emptyMessage)) {
        return emptyMessage;
    }

    if (path) {
        return result.replace(`Configuration "Settings: ${path}":`, "").trim();
    }
    return result.trim();
}

function getEmptyMessage(path) {
    return `Configuration "Settings: ${path}" was empty!`;
}

function readSettings(config, prefix, path) {
    const emptyMessage = getEmptyMessage(path);
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
    return yaml.load(settings, { schema: yaml.JSON_SCHEMA, json: true });
}

function readPath(config, prefix, path) {
    const emptyMessage = getEmptyMessage(path);
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

function convertJsonForDefine(json, path) {
    path =
        "FLOW." +
        path
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

    const define = {};
    define[path] = JSON.stringify(json);
    return define;
}

function resolvePath(path) {
    if (Array.isArray(path)) {
        return path;
    }

    if (typeof path === "number") {
        return [path];
    }

    return path.split(".").map((part) => {
        const partAsInteger = parseInt(part);

        if (!isNaN(partAsInteger) && String(partAsInteger) === part) {
            return partAsInteger;
        }

        return part;
    });
}

function getFromPath(subject, path) {
    return resolvePath(path).reduce((subject, part) => subject && subject[part], subject);
}
