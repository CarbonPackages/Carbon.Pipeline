import fs from "fs-extra";
import path from "path";
import zlib from "zlib";
import { promisify } from "util";
import { compression } from "./helper.mjs";

const compressGz = promisify(zlib.gzip);
const compressBr = promisify(zlib.brotliCompress);

async function write(path, contents) {
    await fs.outputFile(path, contents);
    return { path, contents };
}

async function writeGz(filename, contents) {
    return await write(`${filename}.gz`, await compressGz(contents, { level: compression.gzip }));
}

async function writeBr(filename, contents) {
    return await write(
        `${filename}.br`,
        await compressBr(contents, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: compression.brotli } })
    );
}

function esPlugin({ onEnd } = {}) {
    return {
        name: "esbuild-plugin-compress",
        setup: (build) => {
            if (build.initialOptions.write !== false) {
                throw Error("`write` option of esbuild must be `false`");
            }
            build.onEnd(async (result) => {
                const outputFiles = await Promise.all(
                    result.outputFiles.map(async ({ path: filename, contents }) =>
                        Promise.all([
                            write(filename, contents),
                            compression?.gzip && !filename.endsWith(".LEGAL.txt")
                                ? writeGz(filename, contents)
                                : undefined,
                            compression?.brotli && !filename.endsWith(".LEGAL.txt")
                                ? writeBr(filename, contents)
                                : undefined,
                        ])
                    )
                );
                onEnd?.({ outputFiles: outputFiles.flat().filter(Boolean) });
            });
        },
    };
}

export { esPlugin, writeGz, writeBr };
