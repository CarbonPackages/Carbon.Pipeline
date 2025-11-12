export default function (ctx) {
    return {
        plugins: {
            "postcss-import": {
                resolve: ctx.resolve,
            },
            "tailwindcss/nesting": true,
            tailwindcss: ctx.tailwindcss,
            "postcss-sort-media-queries": true,
            autoprefixer: true,
            cssnano: ctx.minify
                ? {
                      preset: ["default", { discardComments: { removeAll: true }, svgo: false, calc: false }],
                  }
                : false,
            "postcss-reporter": {
                clearReportedMessages: true,
            },
        },
    };
}
