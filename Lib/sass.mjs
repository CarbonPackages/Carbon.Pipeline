import { compile, NodePackageImporter } from "sass";
import { config, styleFiles, compression } from "./helper.mjs";
function render(key) {
    const { sourcemap, inline } = styleFiles[key];
    const result = compile(key, {
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
