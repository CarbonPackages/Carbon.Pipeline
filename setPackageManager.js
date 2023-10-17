const { scripts } = require("../../package.json");
const { execSync } = require("child_process");
const { red, bold, cyan } = require("carbon-pipeline");

const newPackageManager = process.argv[2];

if (!newPackageManager) {
    errorMessage("Please specify a package manager as an argument.");
}

const packageManagers = ["pnpm", "npm", "yarn"];
if (!packageManagers.includes(newPackageManager)) {
    errorMessage("Please specify a valid package manager");
}

// Push dynamic entry for backward compatibility
packageManagers.push("$npm_package_config_packageManager");

const replacementKey = "NEW_PACKAGE_MANAGER";
console.log(" Updating package.json scripts...");
for (const key in scripts) {
    let command = scripts[key];
    // First, replace the package manager with NEW_PACKAGE_MANAGER
    // We have to do this as pnpm and npm are similar
    packageManagers.forEach((oldManger) => {
        command = command.replaceAll(`${oldManger} `, `${replacementKey} `);
        command = command.replaceAll(`${oldManger}:`, `${replacementKey}:`);
    });
    // Now we put the new package manager in place
    command = command.replaceAll(`${replacementKey} `, `${newPackageManager} `);
    command = command.replaceAll(`${replacementKey}:`, `${newPackageManager}:`);
    execSync(`npm pkg set scripts.${key}="${command}"`);
}

sucessMessage();

function sucessMessage() {
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
