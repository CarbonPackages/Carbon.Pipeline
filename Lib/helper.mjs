import { yaml, fs, red, deepmerge, glob } from "carbon-pipeline";
import path from "path";

const scriptFiles = [];
const styleFiles = {};

const watch = argv("watch") === true;
const production = argv("production") === true;
const minify = production || argv("minify") === true;
const silent = argv("silent") === true;

const configFile = argv("configFile") || "pipeline.yaml";
const config = getConfig(configFile);

let compression = false;
if (production && (!watch || argv("compression") === true)) {
    compression = config.buildDefaults.compression;
}
let sass = false;
process.env.NODE_ENV = production ? "production" : "development";

const allFileExtensions = Object.entries(config.extensions)
    .reduce((acc, curr) => {
        return [...acc, ...curr[1]];
    }, [])
    .join(",")
    .replace(/\./g, "");

toArray(config.packages).forEach((entry) => {
    if (!entry.package) {
        error(`No package defined. Please set it in your ${configFile}`);
        process.exit(1);
    }

    if (!compression) {
        removeCompressedFiles(entry);
    }

    const entryFolder = (() => {
        let inputFolder = entry.folder?.input;
        if (!inputFolder && typeof inputFolder !== "string") {
            inputFolder = config.folder.input;
        }
        return path.join(config.folder.base, entry.package, "Resources/Private", inputFolder);
    })();

    if (!fs.existsSync(entryFolder)) {
        if (entry.noErrorIfNotAvailable) {
            return;
        }
        error(`The folder for the package ${entry.package} was not found. Please check your ${configFile}`);
        process.exit(1);
    }

    const ignoredFiles = toArray(entry.ignoredFiles) || [];
    let files = toArray(entry.files);
    if (!files) {
        files = glob
            .sync(`${entryFolder}/*.{${allFileExtensions}}`)
            .map((entry) => path.basename(entry))
            .filter((name) => !name.startsWith("_") && !ignoredFiles.includes(name));
    }
    if (!files) {
        error(`No files found in ${entryFolder}`);
        process.exit(1);
    }

    const scriptEntries = [];
    const moduleEntries = [];
    const commonJsEntries = [];
    files.forEach((filename) => {
        if (checkFileExtension("style", filename)) {
            const needSass = sassFileCheck(filename);
            if (!sass && needSass) {
                sass = true;
            }
            const baseFilename = filename.substring(0, filename.lastIndexOf("."));
            const conf = entryConfig(entry, "style");
            const from = path.join(entryFolder, filename);
            const to = conf.outdir.map((dir) => path.join(dir, `${baseFilename}.css`));
            const sourcemap = conf.sourcemap;
            const length = to[0].length;
            styleFiles[path.resolve(from)] = {
                from,
                to,
                sourcemap,
                length,
                inline: conf.inline,
                outdir: conf.outdir,
                sass: needSass,
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

function argv(key) {
    // Return true if the key exists and a value is defined
    if (process.argv.includes(`--${key}`)) {
        return true;
    }
    const value = process.argv.find((element) => element.startsWith(`--${key}=`));

    // Return null if the key does not exist and a value is not defined
    if (!value) {
        return null;
    }

    return value.replace(`--${key}=`, "");
}

function scriptEntryConfig(entry, entryPoints, type, format = null) {
    const conf = entryConfig(entry, type);
    const external = toArray(entry.external || config.buildDefaults.external) || [];
    format = format || entry.format || config.buildDefaults.format;

    return {
        entryPoints,
        format,
        external,
        ...conf,
    };
}

function sassFileCheck(filename) {
    return filename.endsWith(".scss") || filename.endsWith(".sass");
}

function removeCompressedFiles(entry) {
    const entryOutput = entry.folder?.output || {};
    const outputFolder = deepmerge(config.folder.output, entryOutput);
    const packageName = entryOutput.package || entry.package;
    let files = [];
    toArray(packageName).forEach((pkg) => {
        for (const key in outputFolder) {
            if (key !== "inline" && key !== "package") {
                const folder = path.resolve(path.join(config.folder.base, pkg, "Resources", outputFolder[key]));
                files = [...files, ...glob.sync(`${folder}/*.{br,gz}`)];
            }
        }
    });
    files.forEach((file) => fs.remove(file));
}

function entryConfig(entry, type) {
    const inline = getValue(entry, "inline");
    const sourcemap = inline ? false : getValue(entry, "sourcemap");
    const outputFolderKey = inline ? "inline" : type;
    const folderOutput = entry.folder?.output;

    const defaultExtensions = config.buildDefaults.jsFileExtension;
    const extensions = getValue(entry, "jsFileExtension");
    const extension = extensions ? extensions[type] || defaultExtensions[type] || ".js" : ".js";

    let outputFolder = config.folder.output[outputFolderKey];
    let packageName = entry.package;
    if (folderOutput) {
        outputFolder = folderOutput[outputFolderKey] || outputFolder;
        packageName = folderOutput.package || packageName;
    }
    const outdir = toArray(packageName).map((pkg) => path.join(config.folder.base, pkg, "Resources", outputFolder));
    return {
        sourcemap,
        outdir,
        inline,
        extension,
    };
}

function getValue(entry, key) {
    return typeof entry[key] === "undefined" ? config.buildDefaults[key] : entry[key];
}

function checkFileExtension(type, filename) {
    if (filename.endsWith(".d.ts")) {
        return false;
    }
    return config.extensions[type].some((suffix) => filename.endsWith(suffix));
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function readYamlFile(filePath) {
    try {
        return yaml.load(fs.readFileSync(path.join("./", filePath), "utf8"));
    } catch (err) {
        error(`Error reading ${filePath}:`, err);
        process.exit(1);
    }
}

function error() {
    const linebreak = () => console.log("\n");
    const output = (value) => console.error(value);
    linebreak();
    Array.from(arguments).forEach((err) => {
        if (typeof err === "string") {
            output(red(err));
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
    if (!silent) {
        console.warn(...arguments);
    }
}

function isObject(item) {
    return Object.prototype.toString.call(item) === "[object Object]";
}

function toArray(entry) {
    if (Array.isArray(entry)) {
        // Remove empty and double values
        return [...new Set(entry.filter((item) => !!item))];
    }
    if (entry) {
        return [entry];
    }
    return null;
}

async function dynamicImport(name, selector = "default") {
    const dynamicImport = await import(name);
    if (!selector) {
        return dynamicImport;
    }
    return dynamicImport[selector];
}

function humanFileSize(bytes) {
    const thresh = 1024;
    const sizes = ["b", "kb", "mb"];
    const minLength = {
        value: 6,
        unit: 2,
    };

    if (bytes === 0) {
        return valueOuput(0, sizes[0], minLength);
    }

    const index = Math.floor(Math.log(bytes) / Math.log(thresh));
    return valueOuput(parseFloat((bytes / Math.pow(thresh, index)).toFixed(2)), sizes[index], minLength);
}

function humanDuration(elapsed) {
    const minLength = {
        value: 4,
        unit: 2,
    };
    let time = Math.abs(elapsed[0] * 1e3 + elapsed[1] / 1e6);
    let unit = "h";

    if (time < 1e-3) {
        time = time * 1e6;
        unit = "ns";
    } else if (time < 1) {
        time = time * 1e3;
        unit = "μs";
    } else if (time < 1000) {
        unit = "ms";
    } else if ((time /= 1000) < 60) {
        unit = "s";
    } else if ((time /= 60) < 60) {
        unit = "m";
    }

    return valueOuput(parseFloat(time.toFixed(2)), unit, minLength);
}

function valueOuput(value = "", unit = "", options) {
    const prefix = minLength(value, options.value);
    const suffix = minLength(unit, options.unit);

    return prefix + value + unit + suffix;
}

function minLength(text, minLength = 0) {
    return " ".repeat(Math.max(0, minLength - text.toString().length));
}

function equalArrays(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    // Sort arrays
    a = a.sort();
    b = b.sort();
    return a.every((value, index) => value === b[index]);
}

function getConfig(configFile) {
    const defaultConfig = readYamlFile("Build/Carbon.Pipeline/defaults.yaml");
    const pipelineConfig = readYamlFile(configFile);
    if (!pipelineConfig.import) {
        return mergeConfig(defaultConfig, pipelineConfig);
    }
    const imports = typeof pipelineConfig.import == "string" ? [pipelineConfig.import] : pipelineConfig.import;
    delete pipelineConfig.import;
    let importedConfig = [];
    for (const key in imports) {
        const filePath = imports[key];
        if (filePath) {
            importedConfig.push(readYamlFile(filePath));
        }
    }
    return mergeConfig(defaultConfig, pipelineConfig, ...importedConfig);
}

function mergeConfig() {
    const config = deepmerge(...arguments);
    const settings = config?.buildDefaults?.content;
    if (!settings) {
        return config;
    }
    // Convert object or string to array with unique items
    const contentOptions = toArray(isObject(settings) ? Object.values(settings) : settings);
    const allowed = [];
    const forbidden = [];
    // Sort items into allowed and forbidden
    contentOptions.forEach((option) => {
        if (option.startsWith("!")) {
            forbidden.push(option);
            return;
        }
        allowed.push(option);
    });
    config.buildDefaults.content = [...allowed, ...forbidden];
    return config;
}

export {
    argv,
    asyncForEach,
    scriptFiles,
    styleFiles,
    watch,
    minify,
    config,
    error,
    print,
    toArray,
    production,
    compression,
    sass,
    silent,
    dynamicImport,
    sassFileCheck,
    humanFileSize,
    humanDuration,
    equalArrays,
};
