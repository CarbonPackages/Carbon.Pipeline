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

function writeCheck(filename) {
    return !filename.endsWith(".LEGAL.txt") && !filename.endsWith(".map");
}

async function writeGz(filename, contents) {
    if (!compression?.gzip || !writeCheck(filename)) {
        return undefined;
    }
    return await write(`${filename}.gz`, await compressGz(contents, { level: compression.gzip }));
}

async function writeBr(filename, contents) {
    if (!compression?.brotli || !writeCheck(filename)) {
        return undefined;
    }
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
                            writeGz(filename, contents),
                            writeBr(filename, contents),
                        ])
                    )
                );
                onEnd?.({ outputFiles: outputFiles.flat().filter(Boolean) });
            });
        },
    };
}

export { esPlugin, writeGz, writeBr };
