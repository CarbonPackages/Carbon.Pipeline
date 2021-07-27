import sass from "sass";
import { styleFiles, compression } from "./helper.mjs";
function render(key) {
    const { to, sourcemap } = styleFiles[key];
    const result = sass.renderSync({
        file: key,
        outFile: to[0],
        outputStyle: compression ? "compressed" : "expanded",
        sourceMap: sourcemap,
        sourceMapContents: true,
        sourceMapEmbed: true,
    });
    const css = result.css.toString();
    const importedFiles = [...result.stats.includedFiles].filter((file) => file != key);
    return { css, importedFiles };
}

export { render };
