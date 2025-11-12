export default function (ctx) {
    return {
        plugins: {
            "postcss-import": {
                resolve: ctx.resolve,
            },
            "@tailwindcss/postcss": ctx.tailwindcss,
            "postcss-sort-media-queries": true,
            "postcss-reporter": {
                clearReportedMessages: true,
            },
        },
    };
}
