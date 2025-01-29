export default function (ctx) {
    return {
        plugins: {
            "postcss-import": {
                resolve: ctx.resolve,
            },
            "@tailwindcss/postcss": ctx.tailwindcss,
            "postcss-assets": {
                cachebuster: false,
                basePath: `${ctx.basePath}/`,
                baseUrl: "/_Resources/Static/Packages",
                loadPaths: ["**/Resources/Public/**/*"],
            },
            "postcss-sort-media-queries": true,
            "postcss-reporter": {
                clearReportedMessages: true,
            },
        },
    };
}
