<?php

namespace Carbon\Pipeline;

use Neos\Flow\Cli\ConsoleOutput;
use Neos\Utility\Exception\FilesException;
use Neos\Utility\Files;
use Composer\Installer\PackageEvent;

class Composer
{
    /**
     * Copy files to project root
     *
     * @param PackageEvent|null $event
     * @return void
     * @throws FilesException
     */
    public static function postPackageUpdateAndInstall(?PackageEvent $event = null): void
    {
        if (isset($event) && $event->getIO()->isInteractive() == false) {
            return;
        }

        $console = new ConsoleOutput();
        $console->outputLine('');
        $install = $console->askConfirmation('<question> Do you want to copy the needed files for Carbon.Pipeline to your project root? </question> [<options=bold>Y</>/n] ', true);
        $console->outputLine('');
        if (!$install) {
            return;
        }

        $keepExistingFiles = $console->askConfirmation('<question> Do you want to keep existing files? </question> [<options=bold>Y</>/n] ', true);
        $console->outputLine('');

        $packageManager = $console->select('<question> Which (already installed) package manager you want to use? </question> [<options=bold>pnpm</>]', ['pnpm', 'npm', 'yarn'], 'pnpm');
        $console->outputLine('');

        $cssFrameworkArray = [
            'none' => 'None',
            'bootstrap' => 'Bootstrap (installs also Sass)',
            'tailwindcss@3' => 'Tailwind CSS 3',
            'tailwindcss@4' => 'Tailwind CSS 4',
            'bulma' => 'Bulma (installs also Sass)',
        ];
        $cssFramework = $console->select('<question> Do you want to use a CSS framework? </question> [<options=bold>None</>]', $cssFrameworkArray, 'none');
        $console->outputLine('');

        $sass = false;

        switch ($cssFramework) {
            case 'tailwindcss@3':
                self::copyFile('TailwindCSS3', $keepExistingFiles);
                break;
            case 'tailwindcss@4':
                self::copyFile('TailwindCSS4', $keepExistingFiles);
                break;
            case 'bootstrap':
            case 'bulma':
                $sass = true;
                // no break
            default:
                self::copyFile('NoTailwindCSS', $keepExistingFiles);
                break;
        }

        if (!$sass) {
            $sass = $console->askConfirmation('<question> Do you want to use Sass? </question> [y/<options=bold>N</>] ', false);
            $console->outputLine('');
        }

        $typescript = $console->select('<question> Do you want to use TypeScript or JavaScript? </question>', ['TypeScript', 'JavaScript']) === 'TypeScript';
        $console->outputLine('');

        self::copyFile('Global', $keepExistingFiles);
        if ($typescript) {
            self::copyFile('TypeScript', $keepExistingFiles);
        } else {
            self::copyFile('JavaScript', $keepExistingFiles);
        }

        self::setScripts($packageManager);
        self::installPackage($packageManager, $typescript, $sass, $cssFramework);

        $console->outputLine('<success>Files copied successfully.</success>');
        $console->outputLine('');

        if ($cssFramework == 'tailwindcss@4') {
            $console->outputLine('<info>Make sure to set up the Tailwind CSS 4 configuration as needed. Refer to the official Tailwind CSS documentation for guidance.</info>');
            $console->outputLine('');
            $console->outputLine('<info>An example CSS file could look like this:</info>');
            $console->outputLine('');
            $console->outputLine('@import "tailwindcss" source(none);');
            $console->outputLine('/* Config source based on Carbon.Pipline */');
            $console->outputLine('@config "#tailwindConfig";');
            $console->outputLine('');
            $console->outputLine('<info>Make sure that package.json has following entry:</info>');
            $console->outputLine('"imports": {');
            $console->outputLine('    "#tailwindConfig": "./tailwind.config.mjs"');
            $console->outputLine('}');
        }
    }

    /**
     * Get current working directory
     *
     * @return string
     */
    protected static function getCurrentWorkingDirectory(): string
    {
        return Files::getNormalizedPath(Files::getUnixStylePath(getcwd()));
    }

    /**
     * Install packages
     *
     * @param string $packageManager
     * @param bool $typescript
     * @param string $cssFramework
     * @param bool $sass
     * @return void
     */
    protected static function installPackage(string $packageManager, bool $typescript, bool $sass, string $cssFramework): void
    {
        $packages = $cssFramework == 'none' ? [] : [$cssFramework];

        $packages[] = 'carbon-pipeline concurrently esbuild eslint eslint-config-prettier eslint-plugin-prettier postcss postcss-import prettier stylelint stylelint-config-standard';

        if ($typescript) {
            $packages[] = 'typescript-eslint';
        }
        if ($sass) {
            $packages[] = 'sass node-sass-tilde-importer';
        }
        switch ($cssFramework) {
            case 'tailwindcss@4':
                $packages[] = '@tailwindcss/postcss';
                break;
            case 'tailwindcss@3':
                $packages[] = 'autoprefixer cssnano';
                break;
            default:
                $packages[] = 'postcss-sort-media-queries postcss-reporter autoprefixer cssnano';
                break;
        }

        $dependencies = implode(' ', $packages);
        $installCommand = $packageManager == 'yarn' ? 'add --dev' : 'add -D';
        exec(sprintf('cd %s && %s %s %s', self::getCurrentWorkingDirectory(), $packageManager, $installCommand, $dependencies));
    }

    /**
     * Set scripts in package.json
     *
     * @param string $packageManager
     * @return void
     */
    protected static function setScripts(string $packageManager): void
    {
        $commands = [
            'build' => sprintf("concurrently -r '%s:build:*'", $packageManager),
            'dev' => sprintf("concurrently -r '%s:dev:*'", $packageManager),
            'watch' => sprintf("concurrently -r '%s:watch:*'", $packageManager),
            'pipeline:build' => sprintf("concurrently -r '%s:build:*'", $packageManager),
            'pipeline' => sprintf("%s install;concurrently -r '%s:pipeline:*'", $packageManager, $packageManager),
        ];

        $path = self::getCurrentWorkingDirectory();
        foreach ($commands as $key => $value) {
            exec(sprintf('cd %s && npm pkg set "scripts.%s"="%s"', $path, $key, $value));
        }
    }


    /**
     * Copies files to their place if needed.
     *
     * @param string $folder Path to the installer directory that contains files to copy.
     * @param boolean $keepExistingFiles
     * @return void
     * @throws FilesException
     */
    protected static function copyFile(string $folder, bool $keepExistingFiles): void
    {
        $installPath = 'Build/Carbon.Pipeline/RootFiles/';
        $folder = $installPath . $folder;
        if (is_dir($folder)) {
            Files::copyDirectoryRecursively($folder, self::getCurrentWorkingDirectory(), $keepExistingFiles, true);
        }
    }
}
