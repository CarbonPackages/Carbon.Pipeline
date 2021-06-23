const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const { red } = require("colorette");

const pipeline = readYamlFile("pipeline");
const defaults = readYamlFile("defaults", "Build/Carbon.Pipeline");
const config = { ...defaults, ...pipeline };

function readYamlFile(file, folder) {
    file = `${file}.yaml`;
    const filePath = folder ? path.join(folder, file) : file;
    try {
        return yaml.load(fs.readFileSync(path.join("./", filePath), "utf8"));
    } catch (err) {
        const linebreak = () => console.log("\n");
        linebreak();
        console.error(red(`Error reading ${file}:`));
        console.error(err);
        linebreak();
        process.exit(1);
    }
}

let purge = config.buildDefaults.purge;
if (!Array.isArray(purge)) {
    purge = [purge];
}

module.exports = purge;
