import { config } from "./Lib/helper.mjs";
import { prettyjson } from "carbon-pipeline";

const light = process.argv.includes("--light");

const options = {
    keysColor: light ? "blue" : "yellow",
    dashColor: light ? "brightMagenta" : "magenta",
    stringColor: light ? "black" : "white",
    numberColor: light ? "magenta" : "brightMagenta",
    multilineStringColor: light ? "black" : "white",
    inlineArrays: true,
};

const dump = prettyjson.render(config, options);

console.log(`\n\n${dump}\n\n`);
