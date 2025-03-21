import { config, argv } from "./Lib/helper.mjs";
import { prettyjson } from "carbon-pipeline";

const light = argv("light");
const path = argv("path");

const options = {
    keysColor: light ? "blue" : "yellow",
    dashColor: light ? "brightMagenta" : "magenta",
    stringColor: light ? "black" : "white",
    numberColor: light ? "magenta" : "brightMagenta",
    multilineStringColor: light ? "black" : "white",
    inlineArrays: false,
};

let output = config;
if (path) {
    const parts = path.split(".");
    output = parts.reduce((o, part) => o[part], output);
}
const dump = prettyjson.render(output, options);
console.log(`\n\n${dump}\n\n`);
