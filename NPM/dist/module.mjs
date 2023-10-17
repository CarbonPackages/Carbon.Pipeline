import BROWSERLIST from "browserslist";
import chokidar from "chokidar";
import deepmerge from "deepmerge";
import fs from "fs-extra";
import { glob } from "glob";
import postcssrc from "postcss-load-config";
import prettyjson from "prettyjson";
import readCache from "read-cache";
import resolve from "resolve";
import yaml from "js-yaml";
import { DepGraph } from "dependency-graph";
import { red, bold, dim, cyan, magenta } from "nanocolors";

export {
    BROWSERLIST,
    chokidar,
    deepmerge,
    fs,
    glob,
    postcssrc,
    prettyjson,
    readCache,
    resolve,
    yaml,
    DepGraph,
    red,
    bold,
    dim,
    cyan,
    magenta,
};
