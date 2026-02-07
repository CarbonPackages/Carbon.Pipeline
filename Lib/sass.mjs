import path from "node:path";
import { compile, NodePackageImporter } from "sass";
import { config, styleFiles, compression, toArray } from "./helper.mjs";

const loadPaths = (() => {
    const aliasFolders = [...new Set([config.folder.base, ...toArray(config.folder.additionalAliases)])];
    return [...new Set(aliasFolders.map(folder => path.resolve(path.dirname(folder))))];
})();

function render(key) {
    const { sourcemap, inline } = styleFiles[key];
    const result = compile(key, {
        loadPaths,
        style: compression ? "compressed" : "expanded",
        sourceMap: sourcemap,
        sourceMapIncludeSources: true,
        charset: !inline,
        ...config.sassOptions,
        importers: [new NodePackageImporter()]
    })
    const css = result.css.toString();
    const importedFiles = [...result.loadedUrls].map(item => item.pathname).filter((file) => file != key);
    return { css, importedFiles };
}

export { render };
