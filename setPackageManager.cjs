const fs = require("node:fs");
const path = require("node:path");

const packageJsonPath = path.resolve(__dirname, "../../package.json");
const packageJson = require(packageJsonPath);

const { scripts, config } = packageJson;

const newPackageManager = process.argv[2];
const packageManagers = ["pnpm", "npm", "yarn"];

if (!newPackageManager) {
    errorMessage("Please specify a package manager as an argument.");
}

if (!packageManagers.includes(newPackageManager)) {
    errorMessage("Please specify a valid package manager");
}

if (config?.packageManager) {
    if (Object.keys(config).length === 1) {
        delete packageJson.config;
    } else {
        delete packageJson.config.packageManager;
    }
}

packageManagers.push("$npm_package_config_packageManager");

const replacementKey = "NEW_PACKAGE_MANAGER";

console.log(" Updating package.json scripts...");

for (const key in scripts) {
    let command = scripts[key];

    packageManagers.forEach((oldManager) => {
        command = command.replaceAll(`${oldManager} `, `${replacementKey} `);
        command = command.replaceAll(`${oldManager}:`, `${replacementKey}:`);
    });

    command = command.replaceAll(`${replacementKey} `, `${newPackageManager} `);
    command = command.replaceAll(`${replacementKey}:`, `${newPackageManager}:`);

    packageJson.scripts[key] = command;
}

fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`
);

successMessage();

function successMessage() {
    console.log("\n");
    console.log(cyan(` Set package manager to ${bold(newPackageManager)}`));
    console.log("");
}

function errorMessage(message) {
    const randomPackageManager = packageManagers[Math.floor(Math.random() * packageManagers.length)];
    console.error("\n");
    console.error(red(` ${message}`));
    console.error("");
    console.error(` Valid options are: ${bold(packageManagers.join(", "))}`);
    console.error(` Example: ${cyan(`${randomPackageManager} setPackageManager ${randomPackageManager}`)}`);
    console.error("\n");
    process.exit(1);
}

function cyan(text) {
    return `\x1b[36m${text}\x1b[0m`;
}

function red(text) {
    return `\x1b[31m${text}\x1b[0m`;
}

function bold(text) {
    return `\x1b[1m${text}\x1b[0m`;
}
