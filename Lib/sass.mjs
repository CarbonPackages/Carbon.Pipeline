import sass from "sass";
import tildeImporter from "node-sass-tilde-importer";
import { config, styleFiles, compression } from "./helper.mjs";
function render(key) {
    const { to, sourcemap } = styleFiles[key];
    const result = sass.renderSync({
        outputStyle: compression ? "compressed" : "expanded",
        sourceMap: sourcemap,
        sourceMapContents: true,
        sourceMapEmbed: true,
        ...config.sassOptions,
        file: key,
        outFile: to[0],
        importer: tildeImporter,
    });
    const css = result.css.toString();
    const importedFiles = [...result.stats.includedFiles].filter((file) => file != key);
    return { css, importedFiles };
}

export { render };
