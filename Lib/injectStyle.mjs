import ESBUILD from "esbuild";
import { fs } from "carbon-pipeline";
import path from "path";

export default function style({ minify = true, charset = "utf8" }) {
    return {
        name: "style",
        setup({ onResolve, onLoad }) {
            const cwd = process.cwd();
            const opt = { logLevel: "silent", bundle: true, write: false, charset, minify };

            onResolve({ filter: /\.css$/, namespace: "file" }, (args) => {
                const absPath = path.join(args.resolveDir, args.path);
                const relPath = path.relative(cwd, absPath);
                const resolved = fs.existsSync(absPath) ? relPath : args.path;
                return { path: resolved, namespace: "style-stub" };
            });

            onResolve({ filter: /\.css$/, namespace: "style-stub" }, (args) => ({
                path: args.path,
                namespace: "style-content",
            }));

            onResolve({ filter: /^__style_helper__$/, namespace: "style-stub" }, (args) => ({
                path: args.path,
                namespace: "style-helper",
                sideEffects: false,
            }));

            onLoad({ filter: /.*/, namespace: "style-helper" }, async () => ({
                contents: `
                  export function injectStyle(text) {
                    if (typeof document !== 'undefined') {
                      var style = document.createElement('style')
                      var node = document.createTextNode(text)
                      style.appendChild(node)
                      document.head.appendChild(style)
                    }
                  }
                `,
            }));

            onLoad({ filter: /.*/, namespace: "style-stub" }, async (args) => ({
                contents: `
                  import { injectStyle } from "__style_helper__"
                  import css from ${JSON.stringify(args.path)}
                  injectStyle(css)
                `,
            }));

            onLoad({ filter: /.*/, namespace: "style-content" }, async (args) => {
                const options = { entryPoints: [args.path], ...opt };
                const { errors, warnings, outputFiles } = await ESBUILD.build(options);
                return { errors, warnings, contents: outputFiles[0].text, loader: "text" };
            });
        },
    };
}
