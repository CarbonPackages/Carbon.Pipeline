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
        $install = $console->askConfirmation('<question> Do you want to copy the needed files for Carbon.Pipeline to your project root? </question> (<options=bold>y</>/n) ', true);
        $console->outputLine('');
        if (!$install) {
            return;
        }
        $installPath = 'Build/Carbon.Pipeline/RootFiles/';
        $keepExistingFiles = $console->askConfirmation('<question> Do you want to keep existing files? </question> (<options=bold>y</>/n) ', true);
        $console->outputLine('');
        $typescript = $console->select('<question> Do you want to use TypeScript or JavaScript? </question>', ['TypeScript', 'JavaScript']) === 'TypeScript';
        $console->outputLine('');

        self::copyFile($installPath . 'Global', $keepExistingFiles);
        if ($typescript) {
            self::copyFile($installPath . 'TypeScript', $keepExistingFiles);
        } else {
            self::copyFile($installPath . 'JavaScript', $keepExistingFiles);
        }

        $console->outputLine('<success>Files copied successfully.</success>');
        $console->outputLine('');
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
        if (is_dir($folder)) {
            Files::copyDirectoryRecursively($folder, Files::getUnixStylePath(getcwd()) . '/', $keepExistingFiles, true);
        }
    }
}
