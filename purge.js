const path = require("path");
const fs = require("fs");
const { yaml, red } = require("carbon-pipeline");

const configFile = argv("configFile") || "pipeline.yaml";
let purge = readPurgePath(configFile);
if (!purge) {
    purge = readPurgePath("defaults.yaml", "Build/Carbon.Pipeline");
}

if (!Array.isArray(purge)) {
    purge = [purge];
}

function readPurgePath(file, folder) {
    const filePath = folder ? path.join(folder, file) : file;
    try {
        const definition = yaml.load(fs.readFileSync(path.join("./", filePath), "utf8"));
        return definition?.buildDefaults?.purge;
    } catch (err) {
        const linebreak = () => console.log("\n");
        linebreak();
        console.error(red(`Error reading ${file}:`));
        console.error(err);
        linebreak();
        process.exit(1);
    }
}

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

module.exports = purge;
