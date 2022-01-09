![Carbon.Pipeline – Build stack for Neos CMS][logo]

[![Latest stable version]][packagist] [![Download]][main.zip] [![GitHub stars]][stargazers] [![GitHub watchers]][subscription] [![GitHub license]][license] [![GitHub issues]][issues] [![GitHub forks]][network] [![Twitter]][tweet] [![Sponsor @Jonnitto on GitHub]][sponsor]

**Carbon.Pipeline is a delicious blend of [esbuild] and [PostCSS] to form a full-featured, ultra-fast modern Javascript and CSS bundler for Flow Framework and [Neos CMS].**

## Getting started

First, thank you that you want to give this build stack a try! If you miss a ✨ feature or found a 🐛 bug, feel free to [open an issue].

## Package manager

You can choose between different package manager: [npm], [Yarn] and the ultra-fast and disk-space saving [pnpm]. To set you favorite task manager, set the name (`npm`, `yarn` or `pnpm`) in the `package.json` under the key `config.packageManager`. `pnpm` is set as default.

### Install via composer

Run `composer require carbon/pipeline --dev`. Some files (if not already existing) will be copied to your root folder during the installation. After installing the package, run the command `install` to install the required packages, defined in `package.json`. Feel free to modify and change dependencies before installing 👍

### Manual install

If you want to make some significant adjustments to the build stack, you can also [download the code as zip file][main.zip] and put it in the folder `Build/Carbon.Pipeline`. Go to `Carbon.Pipeline/Installer/Distribution/Defaults` and copy the files to your root folder (Don't forget the hidden files, starting with a dot). After this is done, run the command `install` to install the required packages, defined in `package.json`. Feel free to modify and change dependencies before installing 👍

## Add files to the build stack

The whole configuration, including which files to build, is configured in [`pipeline.yaml`]. The default values are set in [`defaults.yaml`] and merged with your configuration. Under the key `packages`, you can either add an array with package settings or, if you have just one entry, you can directly add the configuration:

```yaml
packages:
  - package: Vendor.Bar
    files:
      - Main.pcss
      - Main.js

# This is the same as
packages:
  package: Vendor.Bar
  files:
    - Main.pcss
    - Main.js
```

If you have just one file, you can pass this directly without creating an array:

```yaml
packages:
  package: Vendor.Bar
  files: Main.js
```

If you don't set files, all parsable files from the input folder get rendered. Files that start with an underscore (`_`) will be ignored.

```yaml
packages:
  package: Vendor.Bar
```

To change the input and/or the output folder, you can do this with the `folder` option:

```yaml
packages:
  package: Vendor.Bar
  folder:
    input: Assets
    output:
      inline: Private/Templates
      style: Public
      script: Public
      module: Public
      commonJS: Public
```

Further, you can write the files to another package:

```yaml
packages:
  package: Vendor.Bar
  folder:
    output:
      package: Vendor.Theme
```

If you want to go crazy with multi-sites in Neos, you can also write the files to multiple packages:

```yaml
packages:
  package: Vendor.Bar
  folder:
    output:
      package:
        - Vendor.Theme
        - Vendor.Bar
```

A package entry has the following options:

| Key                      | Type                | Description                                                                                      | Example              |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------ | -------------------- |
| `package`                | `string`            | The name of the package **(required)**                                                           | `Vendor.Foo`         |
| `files`                  | `string` or `array` | The names of the entry files. If none given, all parsable files in the input folder get rendered | `Main.js`            |
| `folder.input`           | `string`            | The folder under `Resources/Private` where to look for the entry files                           | `Assets`             |
| `folder.output.package`  | `string` or `array` | If set, the files will be writen in a different package (one or multiple)                        | `Foo.Bar`            |
| `folder.output.inline`   | `string`            | The folder where inline files get rendered                                                       | `Private/Templates/` |
| `folder.output.style`    | `string`            | The folder where inline styles rendered                                                          | `Public/Assets`      |
| `folder.output.script`   | `string`            | The folder where inline scripts rendered                                                         | `Public/Assets`      |
| `folder.output.module`   | `string`            | The folder where inline modules rendered                                                         | `Public/Assets`      |
| `folder.output.commonJS` | `string`            | The folder where inline commonJS files get rendered                                              | `Public/Assets`      |
| `external`               | `string` or `array` | You can mark a file or a package as [external] to exclude it from your build.                    | `*/Modules/*`        |
| `inline`                 | `boolean`           | Flag to toggle if the files should be inlined. If set, sourcemaps are disabled                   | `true`               |
| `sourcemap`              | `boolean`           | Flag to toggle source map generation                                                             | `false`              |
| `format`                 | `string`            | Set the format of the output file. [Read more][esbuild format]                                   | `cjs`                |

These are the default values for the folders:

```yaml
folder:
  input: Fusion
  output:
    inline: Private/Templates/InlineAssets
    style: Public/Styles
    script: Public/Scripts
    module: Public/Modules
    commonJS: Public/CommonJS
```

and these for the build options:

```yaml
external: null
inline: false
sourcemap: true
format: iife
```

The target folders can be adjusted under the key `folder.output`. If you want to change the defaults for all your packages, you can also set this globally in your [`pipeline.yaml`]:

```yaml
folder:
  input: Assets
  output:
    inline: Private/Templates
    style: Public
    script: Public
    module: Public
    commonJS: Public

buildDefaults:
  sourcemap: false
  format: esm
```

Please look at the [`defaults.yaml`] file for all the options.

If you set an entry file with the javascript module suffix (`.mjs`, `.mjsx`, `.mts` or `.mtsx`) the format of this file will be enforced to `esm`. The same with commonJS: If you set an entry file with the javascript commonJS suffix (`.cjs`, `.cjsx`, `.cts` or `.ctsx`) the format of this file will be enforced to `cjs`. E.g., if you have the following array `["Main.js", "Module.mjs", "CommonJS.cjs"]`, and have no specific setting for the format, `Main.js` will have the format `iife`, `Module.mjs` will have the format `esm` and `CommonJS.cjs` will have the format `cjs`.

## Tasks

**As you can choose your favorite package manager, you have to prepend the task name with the corresponding name (`pnpm`, `yarn` or `npm run`)**

There are five predefined main tasks:

| Command      | Description                                                                 | Command                                                                                                    |
| ------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `watch`      | Start the file watcher                                                      | `concurrently -r $npm_package_config_packageManager:watch:*`                                               |
| `dev`        | Build the files once                                                        | `concurrently -r $npm_package_config_packageManager:dev:*`                                                 |
| `build`      | Build the files once for production (with optimzed file size)               | `concurrently -r $npm_package_config_packageManager:build:*`                                               |
| `pipeline`   | Run install, and build the files for production                             | `$npm_package_config_packageManager install;concurrently -r $npm_package_config_packageManager:pipeline:*` |
| `showConfig` | Shows the merged configuration from [`pipeline.yaml`] and [`defaults.yaml`] | `node Build/Carbon.Pipeline/showConfig.mjs`                                                                |

The tasks are split up, so they can run in parallel mode. But you can also run them separately:

| Command          | Description                                                   | Command                                                      |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `watch:js`       | Start the file watcher for JavaScript files                   | `node Build/Carbon.Pipeline/esbuild.mjs --watch`             |
| `watch:css`      | Start the file watcher for CSS files                          | `node Build/Carbon.Pipeline/postcss.mjs --watch`             |
| `dev:js`         | Build the files once for JavaScript files                     | `node Build/Carbon.Pipeline/esbuild.mjs`                     |
| `dev:css`        | Build the files once for CSS files                            | `node Build/Carbon.Pipeline/postcss.mjs`                     |
| `build:js`       | Build the JavaScript files once for production                | `node Build/Carbon.Pipeline/esbuild.mjs --production`        |
| `build:css`      | Build the CSS files once for production                       | `node Build/Carbon.Pipeline/postcss.mjs --production`        |
| `pipeline:build` | Build the files once for production (with optimzed file size) | `concurrently -r $npm_package_config_packageManager:build:*` |

### Extendibility

Of course, you can also add your own tasks in the `scripts` section of your `package.json` file. For example, if you have a Neos UI custom editor and want to start all your tasks in one place, you can add them like this:

```
"build:editor": "$npm_package_config_packageManager --dir DistributionPackages/Foo.Editor/Resources/Private/Editor/ build",
"watch:editor": "$npm_package_config_packageManager --dir DistributionPackages/Foo.Editor/Resources/Private/Editor/ watch",
"pipeline:editor": "$npm_package_config_packageManager --dir DistributionPackages/Foo.Editor/Resources/Private/Editor/ install",
```

> Be aware that you may have different syntax for settings options based on the choosen task manager
> To set the current work directory, for example you have to set `--cwd` for `yarn`, `--dir` or `-C` for `pnpm` and `--prefix` for `npm`.

Because the tasks start with `build:`, respectively with `watch:` or `pipeline:`, the tasks will be included in the corresponding root command. In this example, `build`, `watch` or `pipeline`. If you want to go crazy you can even mix different task manager.

## Compression of files

In production mode (`build`), the files also get compressed with [gzip] and [brotli]. You can edit the compression level under the key [`buildDefaults.compression`]. Per default, the highest compression level is set. To disable compression at all, you can set it to `false`:

```yaml
buildDefaults:
  compression: false
```

Or, if you want to disable just one of them, you can set the entry to `false`:

```yaml
buildDefaults:
  compression:
    gzip: false
```

## Import files from DistributionPackages and other Packages

By default, two aliases are predefined: `DistributionPackages` and `Packages`. Like that you can import (CSS and JS) files from other packages like that:

```js
import "DistributionPackages/Vendor.Foo/Resources/Private/Fusion/Main";
import "Packages/Plugins/Jonnitto.PhotoSwipe/Resources/Private/Assets/PhotoSwipe";
```

```css
@import "DistributionPackages/Vendor.Foo/Resources/Private/Fusion/Main.pcss";
@import "Packages/Carbon/Carbon.Image/Resources/Private/Assets/Tailwind.pcss";
```

Thanks to a custom made `resolve` function, you can also use [globbing][glob] in CSS imports: `@import "Presentation/**/*.pcss";`

## CSS

### Sass

If you want to use [Sass] (`.scss`or `.sass` files) you have to install [`sass`] and [`node-sass-tilde-importer`]:

For [pnpm]:

```bash
pnpm add -D sass node-sass-tilde-importer
```

For [Yarn]:

```bash
yarn add --dev sass node-sass-tilde-importer
```

For [npm]:

```bash
npm add -D sass node-sass-tilde-importer
```

You have to ways to import files from `node_modules` (Example with bootstrap):

```css
@import "node_modules/bootstrap/scss/bootstrap";
@import "~bootstrap/scss/bootstrap";
```

<details>
<summary><strong>Pass options to the sass compiler</strong></summary>

You can pass options to the sass compiler with `sassOptions`.

**Example**:
To silencing warnings from stylesheets loaded through importers and load paths you can enable `quietDeps`:

```yaml
sassOptions:
  quietDeps: true
```

</details>

### PostCSS

This template comes with a variety of PostCSS Plugins. Feel free to remove some or add your own favorites packages. The configuration is located in [`.postcssrc.js`]. The suffix of these files should be `.pcss`.

#### PostCSS Plugins

<details>
<summary><strong>Following plugins are included:</strong></summary>

| Name                         | Description                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [postcss-import]             | Plugin to transform `@import` rules by inlining content. Thanks to a custom `resolve` function you can also use [glob]    |
| [Tailwind CSS]               | A utility-first CSS framework for rapidly building custom user interfaces                                                 |
| [postcss-nested]             | Unwrap nested rules like how Sass does it                                                                                 |
| [postcss-assets]             | Plugin to manage assets                                                                                                   |
| [postcss-focus-visible]      | PostCSS Focus Visible lets you use the :focus-visible pseudo-class in CSS, following the Selectors Level 4 specification. |
| [postcss-clip-path-polyfill] | Add SVG hack for clip-path property to make it work in Firefox. Currently supports only `polygon()`                       |
| [postcss-sort-media-queries] | Combine and sort CSS media queries                                                                                        |
| [autoprefixer]               | Parse CSS and add vendor prefixes to CSS rules using values from [Can I Use]                                              |
| [cssnano]                    | Modern CSS compression                                                                                                    |
| [postcss-reporter]           | `console.log()` the messages (warnings, etc.) registered by other PostCSS plugins                                         |

Of course, you can add your own or remove not-needed Plugins as you want. This is just meant as a starting point.

</details>

### Tailwind CSS

This setup comes with [Tailwind CSS], a highly customizable, low-level CSS framework. An example configuration is provided in [`tailwind.config.js`]. The setup for purge the CSS files is also configured. [Read more about controlling the file size here][tailwind file-size]. Because the CSS bundling is done with the Javascript API from PostCSS, the [Just-in-Time Mode] from Tailwind CSS works perfectly. To remove a specific package you could use this pattern in your `pipeline.yaml`:

```yaml
buildDefaults:
  purge:
    - DistributionPackages/**/(Private|NodeTypes)/**/*.{fusion,html,js,jsx,ts,tsx,mjs,mjsx,mts,mtsx,cjs,cjsx,cts,ctsx,svelte,vue}
    - "!DistributionPackages/Package.ToRemove"
```

By the way: [Alpine.js] is excellent in combination with [Tailwind CSS].

## Javascript

<details>
<summary><strong>Flow Settings in Javascript</strong></summary>

If you use tools like [Flownative.Sentry], you perhaps want to pass some of the settings to your Javascript, without setting a `data` attribute somewhere in the markup. For that, you can enable `esbuild.defineFlowSettings`. If set to `true`, all settings are passed. It is recommended to set it to a path (e.g. `Flownative.Sentry`). This path is added as `--path` attribute to the `flow configuration:show` command. If you run the command `build`, which has automatically the flag `--production`, the `FLOW_CONTEXT` is set to `Production`.

```yaml
esbuild:
  defineFlowSettings: Flownative.Sentry
```

In Javascript, you can access the variables like this:

```js
Sentry.init({
  dsn: FLOW.Flownative.Sentry.dsn,
  release: FLOW.Flownative.Sentry.release,
  environment: FLOW.Flownative.Sentry.environment,
  integrations: [new Integrations.BrowserTracing()],
});
```

Make sure your [`.eslintrc`] has the global `FLOW` enabled:

```json
{
  "globals": {
    "FLOW": "readonly"
  }
}
```

</details>

<details>
<summary><strong>Pass options to esbuild</strong></summary>

You can pass options to the [esbuild API] with `esbuild.options`.

**Example**:
To remove some functions from the production build you can use the `esbuild.options.pure` setting. If you have just
one function, you can pass a string, otherwise, you have to set it to an array:

```yaml
esbuild:
  options:
    pure:
      - console.log
      - console.pure
```

</details>

<details>
<summary><strong>TypeScript</strong></summary>

If you want to use [TypeScript], add the following packages to `package.json`:

For [pnpm]:

```bash
pnpm add -D typescript @typescript-eslint/eslint-plugin
```

For [Yarn]:

```bash
yarn add --dev typescript @typescript-eslint/eslint-plugin
```

For [npm]:

```bash
npm add -D typescript @typescript-eslint/eslint-plugin
```

Add your `tsconfig.json` file; this is just an example:

```json
{
  "include": ["DistributionPackages/**/Private/*"],
  "exclude": [
    "node_modules/*",
    "DistributionPackages/**/Public/*",
    "DistributionPackages/**/Private/Templates/InlineAssets*",
    "Packages"
  ],
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "Packages/*": ["Packages/*"],
      "DistributionPackages/*": ["DistributionPackages/*"]
    }
  }
}
```

To enable the correct linting, edit [`.eslintrc`]:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "eslint:recommended",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint"
  ],
  "env": {
    "es6": true,
    "node": true
  },
  "globals": {
    "FLOW": "readonly"
  }
}
```

</details>

<details>
<summary><strong>React</strong></summary>

Using JSX syntax usually requires you to manually import the JSX library you are using. For example, if you are using React, by default, you will need to import React into each JSX file like this:

```js
import * as React from "react";
render(<div />);
```

</details>

<details>
<summary><strong>Preact</strong></summary>

If you're using JSX with a library other than React (such as [Preact],), you'll likely need to configure the [JSX factory] and [JSX fragment] settings since they default to `React.createElement `and `React.Fragment` respectively. Add this to your `tsconfig.json` or `jsconfig.json`:

```json
{
  "compilerOptions": {
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

</details>

<details>
<summary><strong>Svelte</strong></summary>

If you want to use [Svelte], add the following packages to `package.json`:

For [pnpm]:

```bash
pnpm add -D svelte svelte-preprocess esbuild-svelte @tsconfig/svelte
```

For [Yarn]:

```bash
yarn add --dev svelte svelte-preprocess esbuild-svelte @tsconfig/svelte
```

For [npm]:

```bash
npm add -D svelte svelte-preprocess esbuild-svelte @tsconfig/svelte
```

Enable the plugin in your [`pipeline.yaml`] file:

```yaml
esbuild:
  plugins:
    svelte:
      enable: true
      # Add here your options
      options:
        compilerOptions:
          css: true
```

Your `tsconfig.json` may look like this:

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "include": ["DistributionPackages/**/Private/*"],
  "exclude": [
    "node_modules/*",
    "__sapper__/*",
    "DistributionPackages/**/Public/*",
    "DistributionPackages/**/Private/Templates/InlineAssets*",
    "Packages"
  ],
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "Packages/*": ["Packages/*"],
      "DistributionPackages/*": ["DistributionPackages/*"]
    }
  }
}
```

</details>

<details>
<summary><strong>Vue.js</strong></summary>

If you want to use [Vue.js], add the following packages to `package.json`:

For [pnpm]:

```bash
pnpm add -D vue vue-template-compiler esbuild-vue
```

For [Yarn]:

```bash
yarn add --dev vue vue-template-compiler esbuild-vue
```

For [npm]:

```bash
npm add -D vue vue-template-compiler esbuild-vue
```

Enable the plugin in your [`pipeline.yaml`] file:

```yaml
esbuild:
  plugins:
    vue:
      enable: true
      # You can pass your needed options here
      # options:
```

</details>

<details>
<summary><strong>Babel.js / IE 11 support</strong></summary>

If you want to use [Babel.js], add the following packages to `package.json`:

For [pnpm]:

```bash
pnpm add -D @babel/core esbuild-plugin-babel
```

For [Yarn]:

```bash
yarn add --dev @babel/core esbuild-plugin-babel
```

For [npm]:

```bash
npm add -D @babel/core esbuild-plugin-babel
```

as well as additonals babel plugins and/or presets like `@babel/preset-env`, `@babel/plugin-proposal-class-properties`, `@babel/plugin-proposal-object-rest-spread`

Further, you have to add a file called `babel.config.json`, for example:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": false
      }
    ]
  ],
  "plugins": ["@babel/proposal-class-properties", "@babel/proposal-object-rest-spread"]
}
```

Finally, enable the plugin in your [`pipeline.yaml`] file:

```yaml
esbuild:
  plugins:
    babel:
      enable: true
      # You can pass your needed options here
      # options:
```

As the `ENV` variable is set to `development` or `production` if you run the tasks, you can have different setups (For example remove `console` commands with [`babel-plugin-transform-remove-console`] on `production`):

```json
{
  "env": {
    "development": {
      "presets": [
        [
          "@babel/preset-env",
          {
            "modules": false
          }
        ]
      ],
      "plugins": ["@babel/proposal-class-properties", "@babel/proposal-object-rest-spread"]
    },
    "production": {
      "presets": [
        [
          "@babel/preset-env",
          {
            "modules": false
          }
        ]
      ],
      "plugins": ["@babel/proposal-class-properties", "@babel/proposal-object-rest-spread", "transform-remove-console"]
    }
  }
}
```

If you a poor person and have to support Internet Explorer, you have to edit your `.browserslistrc`.
If a browser starting with `ie ` is found, the target `es5` gets activated.

```
defaults
ie 11
not dead
```

</details>
<details>

<summary><strong>Additional esbuild plugins</strong></summary>

You can also add additional [esbuild] plugins, for example [`esbuild-envfile-plugin`]:

```yaml
esbuild:
  additionalPlugins:
    esbuild-envfile-plugin:
      functionName: setup
      options: null
```

As the plugin return not the function directly (like others), you have to also to pass the name of the function.
If a plugin returns directly the function, you don't have to set this. If you want to enable such a plugin without any options, you can just pass `name-of-the-plugin: true`

</details>

## Live-Reloading

If you want to use live reloading, you can do this with [Browsersync].

To install it run `pnpm add --global browser-sync`, `yarn global add browser-sync`, or `npm install -g browser-sync`.

Then you have to create a inital config with `browser-sync init`.
After that, you need to adjust the created `bs-config.js` file.
You can adjust every parameter, but the two parameter you need to set is `files` and `proxy`:

```js
module.exports = {
  files: ["DistributionPackages/**/Public/**/*.css", "DistributionPackages/**/Public/**/*.js"],
  proxy: "http://your.local.domain",
};
```

If you want to also reload the page if a `fusion` or a template file gets changed, you can do so:

```js
module.exports = {
  files: [
    "DistributionPackages/**/Public/**/*.css",
    "DistributionPackages/**/Public/**/*.js",
    "DistributionPackages/**/Private/**/*.fusion",
    "DistributionPackages/**/Private/**/*.html",
  ],
  proxy: "http://your.local.domain",
};
```

Make sure you set the correct proxy with the corresponding protocol (`https://` or `http://`), depending on your setup. To create a better overview of the parameter you can delete the not changed values from the file.

To start Browsersync you can run `browser-sync start --config bs-config.js`. If you want to start it together with `watch`, you can add following line into the `scripts` section:

```
"watch:browsersync": "browser-sync start --config bs-config.js",
```

[packagist]: https://packagist.org/packages/carbon/pipeline
[latest stable version]: https://poser.pugx.org/carbon/pipeline/v/stable
[logo]: https://repository-images.githubusercontent.com/377838441/de0f0b80-d2df-11eb-86a9-7988d27d4ab0
[esbuild]: https://esbuild.github.io
[postcss]: https://postcss.org
[open an issue]: https://github.com/CarbonPackages/Carbon.Pipeline/issues/new
[composer]: https://getcomposer.org
[`pipeline.yaml`]: Installer/Distribution/Defaults/pipeline.yaml
[`defaults.yaml`]: defaults.yaml
[`builddefaults.compression`]: defaults.yaml#L31-L33
[esbuild format]: https://esbuild.github.io/api/#format
[esbuild api]: https://esbuild.github.io/api/
[github issues]: https://img.shields.io/github/issues/CarbonPackages/Carbon.Pipeline
[issues]: https://github.com/CarbonPackages/Carbon.Pipeline/issues
[github forks]: https://img.shields.io/github/forks/CarbonPackages/Carbon.Pipeline
[network]: https://github.com/CarbonPackages/Carbon.Pipeline/network
[github stars]: https://img.shields.io/github/stars/CarbonPackages/Carbon.Pipeline
[stargazers]: https://github.com/CarbonPackages/Carbon.Pipeline/stargazers
[github license]: https://img.shields.io/github/license/CarbonPackages/Carbon.Pipeline
[license]: LICENSE
[twitter]: https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2FCarbonPackages%2FCarbon.Pipeline
[tweet]: https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2FCarbonPackages%2FCarbon.Pipeline
[sponsor @jonnitto on github]: https://img.shields.io/badge/sponsor-Support%20this%20package-informational
[sponsor]: https://github.com/sponsors/jonnitto
[github watchers]: https://img.shields.io/github/watchers/CarbonPackages/Carbon.Pipeline.svg
[subscription]: https://github.com/CarbonPackages/Carbon.Pipeline/subscription
[download]: https://img.shields.io/badge/download-Download%20as%20zip-informational
[main.zip]: https://github.com/CarbonPackages/Carbon.Pipeline/archive/main.zip
[neos cms]: https://www.neos.io
[npm]: https://www.npmjs.com
[yarn]: https://yarnpkg.com
[pnpm]: https://pnpm.io
[`.eslintrc`]: Installer/Distribution/Defaults/.eslintrc
[`.postcssrc.js`]: Installer/Distribution/Defaults/.postcssrc.js
[tailwind css]: https://tailwindcss.com
[just-in-time mode]: https://tailwindcss.com/docs/just-in-time-mode
[alpine.js]: https://github.com/alpinejs/alpine
[`tailwind.config.js`]: Installer/Distribution/Defaults/tailwind.config.js
[tailwind file-size]: https://tailwindcss.com/docs/controlling-file-size
[sass]: https://sass-lang.com
[`sass`]: https://www.npmjs.com/package/sass
[`node-sass-tilde-importer`]: https://www.npmjs.com/package/node-sass-tilde-importer
[postcss-import]: https://www.npmjs.com/package/postcss-import
[postcss-focus-visible]: https://www.npmjs.com/package/postcss-focus-visible
[postcss-nested]: https://www.npmjs.com/package/postcss-nested
[postcss-assets]: https://www.npmjs.com/package/postcss-assets
[postcss-clip-path-polyfill]: https://www.npmjs.com/package/postcss-clip-path-polyfill
[postcss-sort-media-queries]: https://www.npmjs.com/package/postcss-sort-media-queries
[autoprefixer]: https://www.npmjs.com/package/autoprefixer
[can i use]: https://caniuse.com
[cssnano]: https://cssnano.co
[postcss-reporter]: https://www.npmjs.com/package/postcss-reporter
[glob]: https://www.npmjs.com/package/glob
[typescript]: https://www.typescriptlang.org
[react]: https://reactjs.org
[preact]: https://preactjs.com
[svelte]: https://svelte.dev
[vue.js]: https://vuejs.org
[babel.js]: https://babeljs.io
[flownative.sentry]: https://github.com/flownative/flow-sentry
[`babel-plugin-transform-remove-console`]: https://www.npmjs.com/package/babel-plugin-transform-remove-console
[`esbuild-envfile-plugin`]: https://www.npmjs.com/package/esbuild-envfile-plugin
[jsx factory]: https://esbuild.github.io/api/#jsx-factory
[jsx fragment]: https://esbuild.github.io/api/#jsx-fragment
[external]: https://esbuild.github.io/api/#external
[brotli]: https://github.com/google/brotli
[gzip]: https://nodejs.org/api/zlib.html
[browsersync]: https://browsersync.io/
