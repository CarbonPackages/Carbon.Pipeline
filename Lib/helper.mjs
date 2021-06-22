import yaml from "js-yaml";
import fs from "fs-extra";
import path from "path";
import { red } from "colorette";
import deepmerge from "deepmerge";

const pipeline = readYamlFile("pipeline");
const defaults = readYamlFile("defaults", "Build/Carbon.Pipeline");
const config = deepmerge(defaults, pipeline);

const scriptFiles = [];
const styleFiles = {};

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");
const minify = production || process.argv.includes("--minify");
process.env.NODE_ENV = production ? "production" : "development";
process.env.TAILWIND_MODE = watch ? "watch" : "build";

toArray(config.packages).forEach((entry) => {
    const files = toArray(entry.files);
    if (!entry.package || !files) {
        error("No package or file defined. Please set it in your pipeline.yaml");
        process.exit(1);
    }

    const entryFolder = path.join(
        config.folder.base,
        entry.package,
        "Resources/Private",
        entry.folder?.input || config.folder.input
    );
    const scriptEntries = [];
    const moduleEntries = [];
    const commonJsEntries = [];
    files.forEach((filename) => {
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
        } else if (checkFileExtension("commonJS", filename)) {
            commonJsEntries.push(path.join(entryFolder, filename));
        } else if (checkFileExtension("script", filename)) {
            scriptEntries.push(path.join(entryFolder, filename));
        }
    });
    if (scriptEntries.length) {
        scriptFiles.push(scriptEntryConfig(entry, scriptEntries, "script"));
    }
    if (commonJsEntries.length) {
        scriptFiles.push(scriptEntryConfig(entry, commonJsEntries, "commonJS", "cjs"));
    }
    if (moduleEntries.length) {
        scriptFiles.push(scriptEntryConfig(entry, moduleEntries, "module", "esm"));
    }
});

function scriptEntryConfig(entry, entryPoints, type, format = null) {
    const conf = entryConfig(entry, type);
    format = format || entry.format || config.buildDefaults.format;
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
    const folderOutput = entry.folder?.output;
    let outputFolder = config.folder.output[outputFolderKey];
    let packageName = entry.package;
    if (folderOutput) {
        outputFolder = folderOutput[outputFolderKey] || outputFolder;
        packageName = folderOutput.package || packageName;
    }
    const outdir = path.join(config.folder.base, packageName, "Resources", outputFolder);
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

function error() {
    const linebreak = () => console.log("\n");
    const output = (value) => console.error(value);
    linebreak();
    Array.from(arguments).forEach((err) => {
        if (typeof err === "string") {
            output(err);
        } else if (err.name === "CssSyntaxError") {
            output(err.toString());
        } else {
            output(err);
        }
    });
    linebreak();

    // Watch mode shouldn't exit on error
    if (watch) {
        return;
    }
    process.exit(1);
}

function print() {
    console.warn(...arguments);
}

function toArray(entry) {
    if (Array.isArray(entry)) {
        return entry.filter((item) => !!item);
    }
    if (entry) {
        return [entry];
    }
    return null;
}

export { asyncForEach, scriptFiles, styleFiles, watch, minify, config, error, print, toArray };
