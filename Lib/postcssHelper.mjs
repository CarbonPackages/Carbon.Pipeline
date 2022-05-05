import path from "path";
import { glob, postcssrc, resolve, DepGraph } from "carbon-pipeline";
import { minify, config, toArray } from "./helper.mjs";

function rc() {
    return postcssrc({
        minify,
        basePath: config.folder.base,
        resolve: importResolve,
        ...config.postcssOptions,
    })
        .then((rc) => {
            return rc;
        })
        .catch((err) => {
            if (!err.message.includes("No PostCSS Config found")) {
                throw err;
            }
        });
}

const importAliases = (() => {
    const alias = {};
    const aliasFolders = [...new Set([config.folder.base, ...toArray(config.folder.additionalAliases)])];
    aliasFolders.forEach((folder) => {
        alias[folder] = path.resolve(path.dirname(folder), folder);
    });
    return alias;
})();

function resolveAlias(path) {
    const pathComponents = path.split("/");
    const [base] = pathComponents;

    if (importAliases.hasOwnProperty(base)) {
        pathComponents[0] = importAliases[base];
        return resolveAlias(pathComponents.join("/"));
    }

    return pathComponents.join("/");
}

function resolveModule(id, opts) {
    id = resolveAlias(id);
    return new Promise((res, rej) => {
        resolve(id, opts, (err, path) => (err ? rej(err) : res(path)));
    });
}

function importResolve(id, base, options) {
    const paths = options.path;
    const resolveOpts = {
        basedir: base,
        paths,
        moduleDirectory: ["web_modules", "node_modules"].concat(options.addModulesDirectories),
        extensions: [".css", ".pcss"],
        packageFilter: function processPackage(pkg) {
            if (pkg.style) {
                pkg.main = pkg.style;
            } else if (!pkg.main || !/\.css$/.test(pkg.main)) {
                pkg.main = "index.css";
            }
            return pkg;
        },
        preserveSymlinks: false,
    };

    const files = glob.hasMagic(id) ? glob.sync(path.join(base, id)) : [id];
    return Promise.all(
        files.map((id) =>
            resolveModule(`./${id}`, resolveOpts)
                .catch(() => resolveModule(id, resolveOpts))
                .catch(() => {
                    if (paths.indexOf(base) === -1) {
                        paths.unshift(base);
                    }
                    throw new Error(`Failed to find '${id}' in [${paths.join(",\n        ")}]`);
                })
        )
    );
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

    toArray(results).forEach((result) => {
        if (result.messages <= 0) {
            return;
        }

        result.messages
            .filter((msg) => (msg.type === "dependency" || msg.type === "dir-dependency" ? msg : ""))
            .map(dependencyGraph.add)
            .forEach((dependency) => {
                if (dependency.type === "dir-dependency") {
                    const dir = dependency.glob ? path.join(dependency.dir, dependency.glob) : dependency.dir;
                    messages.push(dir);
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

export { rc, dependencyGraph, dependencies, getAncestorDirs };
