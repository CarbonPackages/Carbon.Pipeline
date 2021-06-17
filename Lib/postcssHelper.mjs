import path from "path";
import postcssrc from "postcss-load-config";
import nodeResolve from "resolve";
import { DepGraph } from "dependency-graph";
import { cssFiles, watch, minify, config, error, print, stringToArray } from "./helper.mjs";

function rc() {
    return postcssrc({
        importAlias: (() => {
            const alias = {};
            const aliasFolders = [...new Set([config.folder.base, ...stringToArray(config.folder.additionalAliases)])];
            aliasFolders.forEach((folder) => {
                alias[folder] = path.resolve(path.dirname(folder), folder);
            });
            return alias;
        })(),
        easyImport: {
            extensions: config.extensions.css,
            prefix: "_",
        },
        minify: minify,
        basePath: config.folder.base,
    })
        .then((rc) => {
            return rc;
        })
        .catch((err) => {
            if (!err.message.includes("No PostCSS Config found")) throw err;
        });
}

const graph = new DepGraph();
const dependencyGraph = {
    add(message) {
        message.parent = path.resolve(message.parent);
        graph.addNode(message.parent);

        if (message.type === "dir-dependency") {
            message.dir = path.resolve(message.dir);
            graph.addNode(message.dir);
            graph.addDependency(message.parent, message.dir);
        } else {
            message.file = path.resolve(message.file);
            graph.addNode(message.file);
            graph.addDependency(message.parent, message.file);
        }

        return message;
    },
    dependantsOf(node) {
        node = path.resolve(node);

        if (graph.hasNode(node)) {
            return graph.dependantsOf(node);
        }
        return [];
    },
};

function dependencies(results) {
    const messages = [];

    stringToArray(results).forEach((result) => {
        if (result.messages <= 0) return;

        result.messages
            .filter((msg) => (msg.type === "dependency" || msg.type === "dir-dependency" ? msg : ""))
            .map(dependencyGraph.add)
            .forEach((dependency) => {
                if (dependency.type === "dir-dependency") {
                    messages.push(dependency.dir);
                } else {
                    messages.push(dependency.file);
                }
            });
    });

    return messages;
}

// Input: '/imports/components/button.css'
// Output: ['/imports/components', '/imports', '/']
function getAncestorDirs(fileOrDir) {
    const { root } = path.parse(fileOrDir);
    if (fileOrDir === root) {
        return [];
    }
    const parentDir = path.dirname(fileOrDir);
    return [parentDir, ...getAncestorDirs(parentDir)];
}

const rebasePlugin = (({ rootDir = process.cwd() } = {}) => {
    return {
        postcssPlugin: "postcss-rebase",
        AtRule: {
            async import(decl) {
                let match = decl.params.match(/url\(['"]?(.*?)['"]?\)/);
                if (!match || !match[1]) {
                    return;
                }

                let source = match[1];
                if (
                    source.startsWith(".") ||
                    source.startsWith("/") ||
                    source.startsWith("http:") ||
                    source.startsWith("https:")
                ) {
                    return;
                }

                if (source.startsWith("~")) {
                    source = source.substring(1);
                }

                let resolvedImportPath = await new Promise((resolve, reject) =>
                    nodeResolve(
                        source,
                        {
                            basedir: rootDir,
                            extensions: [".css"],
                            preserveSymlinks: true,
                            packageFilter(pkg) {
                                if (pkg.style) {
                                    pkg.main = pkg.style;
                                }
                                return pkg;
                            },
                        },
                        (err, data) => (err ? reject(err) : resolve(data))
                    )
                );

                if (path.extname(resolvedImportPath) !== ".css") {
                    return;
                }

                decl.params = `url('${resolvedImportPath}')`;
            },
        },
    };
})();

export { rc, dependencyGraph, dependencies, getAncestorDirs, watch, cssFiles as files, rebasePlugin, error, print };
