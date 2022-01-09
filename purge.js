const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const { red } = require("nanocolors");

function readPurgePath(file, folder) {
    file = `${file}.yaml`;
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

let purge = readPurgePath("pipeline");
if (!purge) {
    purge = readPurgePath("defaults", "Build/Carbon.Pipeline");
}

if (!Array.isArray(purge)) {
    purge = [purge];
}

module.exports = purge;
