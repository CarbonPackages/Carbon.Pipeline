const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");

const pipeline = readYamlFile("pipeline");
const defaults = readYamlFile("defaults", "Build/Carbon.Pipeline");
const config = { ...defaults, ...pipeline };

function readYamlFile(file, folder) {
    const filePath = folder ? path.join(folder, `${file}.yaml`) : `${file}.yaml`;
    try {
        return yaml.load(fs.readFileSync(path.join("./", filePath), "utf8"));
    } catch (err) {
        error(err);
        process.exit(1);
    }
}

let purge = config.buildDefaults.purge;
if (!Array.isArray(purge)) {
    purge = [purge];
}

module.exports = purge;
