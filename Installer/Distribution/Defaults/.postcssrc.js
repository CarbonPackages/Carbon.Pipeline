// cssnano and svgo optimisation has some issues with pleeease-filters
module.exports = (ctx) => ({
    plugins: {
        "postcss-import-alias": ctx.importAlias,
        "postcss-easy-import": ctx.easyImport,
        tailwindcss: true,
        "postcss-nested": {
            bubble: ["layer", "variants", "responsive", "screen"],
        },
        "postcss-assets": {
            cachebuster: false,
            basePath: "DistributionPackages/",
            baseUrl: "/_Resources/Static/Packages",
            loadPaths: ["**/Resources/Public/**/*"],
        },
        "postcss-url": {
            filter: /\/_Resources\/Static\/Packages\/[\w]+\.[\w]+\/Resources\/Public\/.*/,
            url: (asset) => asset.url.replace("/Resources/Public/", "/"),
        },
        "postcss-normalize": {
            allowDuplicates: false,
            forceImport: false,
        },
        "postcss-preset-env": {
            stage: 1,
            autoprefixer: false,
            features: {
                "focus-within-pseudo-class": false,
            },
        },
        "postcss-easing-gradients": {
            colorStops: 15,
            alphaDecimals: 5,
            colorMode: "lrgb",
        },
        "postcss-for": true,
        "postcss-each": true,
        "postcss-hexrgba": true,
        "postcss-clip-path-polyfill": true,
        "postcss-responsive-type": true,
        "postcss-easings": true,
        "pleeease-filters": true,
        "postcss-quantity-queries": true,
        "postcss-momentum-scrolling": ["scroll", "auto", "inherit"],
        "postcss-round-subpixels": true,
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
