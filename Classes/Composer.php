<?php

namespace Carbon\Pipeline;

use Neos\Flow\Cli\ConsoleOutput;
use Neos\Utility\Exception\FilesException;
use Neos\Utility\Files;

class Composer
{
    /**
     * Copy files to project root
     *
     * @return void
     * @throws FilesException
     */
    public static function postPackageUpdateAndInstall(): void
    {
        $console = new ConsoleOutput();
        $console->outputLine('');
        $install = $console->askConfirmation('<question> Do you want to copy the needed files for Carbon.Pipeline to your project root? </question> [<options=bold>Y</>/n] ', true);
        $console->outputLine('');
        if (!$install) {
            return;
        }

        $keepExistingFiles = $console->askConfirmation('<question> Do you want to keep existing files? </question> [<options=bold>Y</>/n] ', true);
        $console->outputLine('');

        $packageManager = $console->select('<question> Which package manager you want to use? </question>', ['pnpm', 'npm', 'yarn']);
        $console->outputLine('');

        $cssFrameworkArray = [
            'bootstrap' => 'Bootstrap (installs also Sass)',
            'tailwindcss' => 'Tailwind CSS',
            'bulma' => 'Bulma (installs also Sass)',
        ];
        $cssFramework = $console->select('<question> Do you want to use a CSS framework? </question>', $cssFrameworkArray, null, true);
        $console->outputLine('');

        $sass = in_array('bootstrap', $cssFramework) || in_array('bulma', $cssFramework);
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
        if (in_array('tailwindcss', $cssFramework)) {
            self::copyFile('TailwindCSS', $keepExistingFiles);
        } else {
            self::copyFile('NoTailwindCSS', $keepExistingFiles);
        }

        self::setScripts($packageManager);
        self::installPackage($packageManager, $typescript, $sass, $cssFramework);

        $console->outputLine('<success>Files copied successfully.</success>');
        $console->outputLine('');
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
     * @param array<int,string> $cssFramework
     * @param bool $sass
     * @return void
     */
    protected static function installPackage(string $packageManager, bool $typescript, bool $sass, array $cssFramework): void
    {
        $packages = $cssFramework;
        if ($typescript) {
            $packages[] = 'typescript-eslint';
        }
        if ($sass) {
            $packages[] = 'sass node-sass-tilde-importer';
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
            'build' => sprintf('concurrently -r %s:build:*', $packageManager),
            'dev' => sprintf('concurrently -r %s:dev:*', $packageManager),
            'pipeline:build' => sprintf('concurrently -r %s:build:*', $packageManager),
            'pipeline' => sprintf('%s install;concurrently -r %s:pipeline:*', $packageManager, $packageManager),
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
