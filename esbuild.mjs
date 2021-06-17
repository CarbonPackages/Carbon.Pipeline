import ESBUILD from "esbuild";
import { browserlist, asyncForEach, files, watch, minify, error } from "./Lib/esbuildHelper.mjs";

async function build() {
    await asyncForEach(files, async ({ entryPoints, sourcemap, outdir, format }) => {
        await ESBUILD.build({
            entryPoints,
            sourcemap,
            bundle: true,
            platform: "browser",
            outdir,
            format,
            minify,
            watch,
            target: browserlist,
            legalComments: "linked",
        }).catch(error);
    });
}

build();
