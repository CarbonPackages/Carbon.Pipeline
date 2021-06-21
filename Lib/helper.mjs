import yaml from "js-yaml";
import fs from "fs-extra";
import path from "path";
import { red } from "colorette";

const pipeline = readYamlFile("pipeline");
const defaults = readYamlFile("defaults", "Build/Carbon.Pipeline");
const config = { ...defaults, ...pipeline };

const scriptFiles = [];
const styleFiles = {};

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");
const minify = production || process.argv.includes("--minify");
process.env.NODE_ENV = production ? "production" : "development";
process.env.TAILWIND_MODE = watch ? "watch" : "build";




stringToArray(config.packages).forEach((entry) => {
    const entryFolder = path.join(
        config.folder.base,
        entry.name,
        "Resources/Private",
        entry.folder?.input || config.folder.input
    );
    const scriptEntries = [];
    const moduleEntries = [];
    stringToArray(entry.files).forEach((filename) => {
        if (checkFileExtension("style", filename)) {
            const baseFilename = filename.substring(0, filename.lastIndexOf("."));
            const conf = entryConfig(entry, "style");
            const from = path.join(entryFolder, filename);
            styleFiles[path.resolve(from)] = {
                from,
                to: path.join(conf.outdir, `${baseFilename}.css`),
                sourcemap: conf.sourcemap,
                outdir: conf.outdir,
            };
        } else if (checkFileExtension("module", filename)) {
            moduleEntries.push(path.join(entryFolder, filename));
        } else if (checkFileExtension("script", filename)) {
            scriptEntries.push(path.join(entryFolder, filename));
        }
    });
    if (scriptEntries.length) {
        scriptFiles.push(scriptEntryConfig(entry, scriptEntries, "script"));
    }
    if (moduleEntries.length) {
        scriptFiles.push(scriptEntryConfig(entry, moduleEntries, "module"));
    }
});

function scriptEntryConfig(entry, entryPoints, type) {
    const conf = entryConfig(entry, type);
    const format = type === "module" ? "esm" : entry.format || config.buildDefaults.format;

    return {
        entryPoints,
        format,
        ...conf,
    };
}

function entryConfig(entry, type) {
    const inline = getValue(entry, "inline");
    const sourcemap = inline ? false : getValue(entry, "sourcemap");
    const outputFolderKey = inline ? "inline" : type;
    let outputFolder = config.folder.output[outputFolderKey];
    if (entry.folder?.output) {
        outputFolder = getValue(entry.folder.output, outputFolderKey);
    }
    const outdir = path.join(config.folder.base, entry.name, "Resources", outputFolder);
    return {
        sourcemap,
        outdir,
    };
}

function getValue(entry, key) {
    return typeof entry[key] === "undefined" ? config.buildDefaults[key] : entry[key];
}

function checkFileExtension(type, filename) {
    return config.extensions[type].some((suffix) => filename.endsWith(suffix));
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function readYamlFile(file, folder) {
    const filePath = folder ? path.join(folder, `${file}.yaml`) : `${file}.yaml`;
    try {
        return yaml.load(fs.readFileSync(path.join("./", filePath), "utf8"));
    } catch (err) {
        error(err);
        process.exit(1);
    }
}

function error(err) {
    let feedback = err;
    if (typeof err === "string") {
        feedback = red(err);
    } else if (err.name === "CssSyntaxError") {
        feedback = err.toString();
    }
    console.error(`\n${feedback}\n`);

    // Watch mode shouldn't exit on error
    if (watch) {
        return;
    }
    process.exit(1);
}

function print(message) {
    console.warn(message);
}

function stringToArray(entry) {
    if (Array.isArray(entry)) {
        return entry.filter((item) => !!item);
    }
    if (entry) {
        return [entry];
    }
    return null;
}

export { asyncForEach, scriptFiles, styleFiles, watch, minify, config, error, print, stringToArray };
