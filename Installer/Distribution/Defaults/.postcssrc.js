// cssnano and svgo optimisation has some issues with pleeease-filters
module.exports = (ctx) => ({
    plugins: {
        "postcss-import": {
            resolve: ctx.resolve,
        },
        tailwindcss: true,
        "postcss-nested": {
            bubble: ["layer", "variants", "responsive", "screen"],
        },
        "postcss-assets": {
            cachebuster: false,
            basePath: `${ctx.basePath}/`,
            baseUrl: "/_Resources/Static/Packages",
            loadPaths: ["**/Resources/Public/**/*"],
        },
        "postcss-focus-visible": true,
        "postcss-clip-path-polyfill": true,
        "postcss-sort-media-queries": true,
        autoprefixer: true,
        cssnano: ctx.minify
            ? {
                  preset: ["default", { discardComments: { removeAll: true }, svgo: false }],
              }
            : false,
        "postcss-reporter": {
            clearReportedMessages: true,
        },
    },
});
