![Carbon.Pipeline – Build stack for Neos CMS][logo]

[![Download]][main.zip] [![David]][david-dm] [![GitHub stars]][stargazers] [![GitHub watchers]][subscription] [![GitHub license]][license] [![GitHub issues]][issues] [![GitHub forks]][network] [![Twitter]][tweet] [![Sponsor @Jonnitto on GitHub]][sponsor]

**Carbon.Pipeline is a delicious blend of [esbuild] and [PostCSS] to form a full-featured, ultra-fast modern Javascript and CSS bundler for Flow Framework and [Neos CMS].**

## Getting started

To use this build stack, you can either run `composer require carbon/pipeline --dev` or [download the code as zip file][main.zip] and put it in the folder `Build/Carbon.Pipeline`. It's recommended only to download manually if you want to make some more significant adjustments to the build stack. If you miss a :sparkles: feature or found a :bug: bug, feel free to [open an issue].

If you install the build stack via [composer], some files (if not already existing) will be copied to your root folder.

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

To change the input and / or the output folder, you can to this with the `folder` option:

```yaml
packages:
  package: Vendor.Bar
  files: Main.js
  folder:
    input: Assets
    output:
      inline: Private/Templates
      style: Public
      script: Public
      module: Public
      commonJS: Public
```

A package entry has the following options:

| Key                      | Type                | Description                                                                    | Example              |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------ | -------------------- |
| `package`                | `string`            | The name of the package (required)                                             | `Vendor.Foo`         |
| `files`                  | `array` or `string` | The names of the entry files (required)                                        | `Main.js`            |
| `folder.input`           | `string`            | The folder under `Resources/Private` where to look for the entry files         | `Assets`             |
| `folder.output.package`  | `string`            | If set, the files will be writen in a different package                        | `Foo.Bar`            |
| `folder.output.inline`   | `string`            | The folder where inline files get rendered                                     | `Private/Templates/` |
| `folder.output.style`    | `string`            | The folder where inline styles rendered                                        | `Public/Assets`      |
| `folder.output.script`   | `string`            | The folder where inline scripts rendered                                       | `Public/Assets`      |
| `folder.output.module`   | `string`            | The folder where inline modules rendered                                       | `Public/Assets`      |
| `folder.output.commonJS` | `string`            | The folder where inline commonJS files get rendered                            | `Public/Assets`      |
| `inline`                 | `boolean`           | Flag to toggle if the files should be inlined. If set, sourcemaps are disabled | `true`               |
| `sourcemap`              | `boolean`           | Flag to toggle source map generation                                           | `false`              |
| `format`                 | `string`            | Set the format of the output file. [Read more][esbuild format]                 | `cjs`                |

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

## Yarn tasks

There are four predefined tasks:

| Command         | Description                                     | Optimize file size | Command                                              |
| --------------- | ----------------------------------------------- | :----------------: | ---------------------------------------------------- |
| `yarn watch`    | Start the file watcher                          |                    | `concurrently -r yarn:watch:*`                       |
| `yarn dev`      | Build the files once                            |                    | `concurrently -r yarn:dev:*`                         |
| `yarn build`    | Build the files once for production             |         ✓          | `concurrently -r yarn:build:*`                       |
| `yarn pipeline` | Run install, and build the files for production |         ✓          | `yarn install --silent --non-interactive;yarn build` |

The tasks are split up, so they can run in parallel mode. But you can also run them separately:

| Command          | Description                                    | Optimize file size | Command                                                 |
| ---------------- | ---------------------------------------------- | :----------------: | ------------------------------------------------------- |
| `yarn watch:js`  | Start the file watcher for JavaScript files    |                    | `node ./Build/Carbon.Pipeline/esbuild.mjs --watch`      |
| `yarn watch:css` | Start the file watcher for CSS files           |                    | `node ./Build/Carbon.Pipeline/postcss.mjs --watch`      |
| `yarn dev:js`    | Build the files once for JavaScript files      |                    | `node ./Build/Carbon.Pipeline/esbuild.mjs`              |
| `yarn dev:css`   | Build the files once for CSS files             |                    | `node ./Build/Carbon.Pipeline/postcss.mjs`              |
| `yarn build:js`  | Build the JavaScript files once for production |         ✓          | `node ./Build/Carbon.Pipeline/esbuild.mjs --production` |
| `yarn build:css` | Build the CSS files once for production        |         ✓          | `node ./Build/Carbon.Pipeline/postcss.mjs --production` |

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

Thanks to [postcss-easy-import], you can also use globbing in CSS imports: `@import "Presentation/**/*.pcss";`

### PostCSS

This template comes with a variety of PostCSS Plugins. Feel free to remove some or add your own favorites packages. The configuration is located in [`.postcssrc.js`]. The suffix of these files should be `.pcss`.

#### PostCSS Plugins

<details>
<summary><strong>Following plugins are included:</strong></summary>

| Name                         | Description                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| [postcss-import-alias]       | Use aliases in your PostCSS import statements                                                         |
| [postcss-easy-import]        | Resolving files with globs                                                                            |
| [Tailwind CSS]               | A utility-first CSS framework for rapidly building custom user interfaces                             |
| [postcss-nested]             | Unwrap nested rules like how Sass does it                                                             |
| [postcss-assets]             | Plugin to manage assets                                                                               |
| [postcss-url]                | Used for rebaseing the url from [postcss-assets]                                                      |
| [postcss-normalize]          | Lets you use the parts of normalize.css or sanitize.css that you need from your browserslist          |
| [postcss-preset-env]         | Preset Env lets you convert modern CSS into something most browsers can understand                    |
| [postcss-easing-gradients]   | Create smooth linear-gradients that approximate easing functions. [Visual examples][easing-gradients] |
| [postcss-for]                | Enables `@for` loop syntax in your CSS                                                                |
| [postcss-each]               | Plugin to iterate through values with `@each`                                                         |
| [postcss-hexrgba]            | Adds shorthand hex methods to `rgba()` values                                                         |
| [postcss-clip-path-polyfill] | Add SVG hack for clip-path property to make it work in Firefox. Currently supports only `polygon()`   |
| [postcss-easings]            | Replace easing name from [easings.net] to cubic-bezier()                                              |
| [pleeease-filters]           | Convert CSS shorthand filters to SVG equivalent                                                       |
| [postcss-quantity-queries]   | Enabling quantity-queries                                                                             |
| [postcss-momentum-scrolling] | Adding momentum style scrolling behavior for elements with overflow on iOS                            |
| [postcss-round-subpixels]    | Rounds sub-pixel (eg: `12.87378378364px`) values to the nearest full pixel                            |
| [postcss-sort-media-queries] | Combine and sort CSS media queries                                                                    |
| [autoprefixer]               | Parse CSS and add vendor prefixes to CSS rules using values from [Can I Use]                          |
| [cssnano]                    | Modern CSS compression                                                                                |
| [postcss-reporter]           | `console.log()` the messages (warnings, etc.) registered by other PostCSS plugins                     |

</details>

### Tailwind CSS

This setup comes with [Tailwind CSS], a highly customizable, low-level CSS framework. An example configuration is provided in [`tailwind.config.js`]. The setup for purge the CSS files is also configured. [Read more about controlling the file size here][tailwind file-size]. Because the CSS bundling is done with the Javascript API from PostCSS, the [Just-in-Time Mode] from Tailwind CSS works perfectly.

By the way: [Alpine.js] is excellent in combination with [Tailwind CSS].

## Javascript

<details>
<summary><strong>TypeScript</strong></summary>

If you want to use [TypeScript], add the following packages to `package.json`:

```bash
yarn add --dev typescript @typescript-eslint/eslint-plugin
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
  }
}
```

</details>

<details>
<summary><strong>React</strong></summary>

Using JSX syntax usually requires you to manually import the JSX library you are using. For example, if you are using React, by default you will need to import React into each JSX file like this:

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

```bash
yarn add --dev svelte svelte-preprocess esbuild-svelte @tsconfig/svelte
```

Enable the plugin in your [`pipeline.yaml`] file:

```yaml
esbuild:
  plugins:
    svelte:
      enable: true
      # Add here your options
      options:
        compileOptions:
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

```bash
yarn add --dev vue vue-template-compiler esbuild-vue
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

[logo]: https://repository-images.githubusercontent.com/377838441/de0f0b80-d2df-11eb-86a9-7988d27d4ab0
[esbuild]: https://esbuild.github.io
[postcss]: https://postcss.org
[open an issue]: https://github.com/CarbonPackages/Carbon.Pipeline/issues/new
[composer]: https://getcomposer.org
[`pipeline.yaml`]: Installer/Distribution/Defaults/pipeline.yaml
[`defaults.yaml`]: defaults.yaml
[esbuild format]: https://esbuild.github.io/api/#format
[david]: https://img.shields.io/david/dev/CarbonPackages/Carbon.Pipeline?label=dependencies&logo=npm&path=Installer%2FDistribution%2FDefaults
[david-dm]: https://david-dm.org/CarbonPackages/Carbon.Pipeline?type=dev&path=Installer/Distribution/Defaults
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
[`.eslintrc`]: Installer/Distribution/Defaults/.eslintrc
[`.postcssrc.js`]: Installer/Distribution/Defaults/.postcssrc.js
[tailwind css]: https://tailwindcss.com
[just-in-time mode]: https://tailwindcss.com/docs/just-in-time-mode
[alpine.js]: https://github.com/alpinejs/alpine
[`tailwind.config.js`]: Installer/Distribution/Defaults/tailwind.config.js
[tailwind file-size]: https://tailwindcss.com/docs/controlling-file-size
[postcss-import-alias]: https://www.npmjs.com/package/postcss-import-alias
[postcss-easy-import]: https://www.npmjs.com/package/postcss-easy-import
[postcss-nested]: https://www.npmjs.com/package/postcss-nested
[postcss-assets]: https://www.npmjs.com/package/postcss-assets
[postcss-url]: https://www.npmjs.com/package/postcss-url
[postcss-normalize]: https://www.npmjs.com/package/postcss-normalize
[postcss-preset-env]: https://preset-env.cssdb.org
[postcss-easing-gradients]: https://www.npmjs.com/package/postcss-easing-gradients
[easing-gradients]: https://larsenwork.com/easing-gradients
[postcss-for]: https://www.npmjs.com/package/postcss-for
[postcss-each]: https://www.npmjs.com/package/postcss-each
[postcss-hexrgba]: https://www.npmjs.com/package/postcss-hexrgba
[postcss-clip-path-polyfill]: https://www.npmjs.com/package/postcss-clip-path-polyfill
[postcss-easings]: https://www.npmjs.com/package/postcss-easings
[easings.net]: https://easings.net
[pleeease-filters]: https://www.npmjs.com/package/pleeease-filters
[postcss-quantity-queries]: https://www.npmjs.com/package/postcss-quantity-queries
[postcss-momentum-scrolling]: https://www.npmjs.com/package/postcss-momentum-scrolling
[postcss-round-subpixels]: https://www.npmjs.com/package/postcss-round-subpixels
[postcss-sort-media-queries]: https://www.npmjs.com/package/postcss-sort-media-queries
[autoprefixer]: https://www.npmjs.com/package/autoprefixer
[can i use]: https://caniuse.com
[cssnano]: https://cssnano.co
[postcss-reporter]: https://www.npmjs.com/package/postcss-reporter
[typescript]: https://www.typescriptlang.org
[react]: https://reactjs.org
[preact]: https://preactjs.com
[svelte]: https://svelte.dev
[vue.js]: https://vuejs.org
[jsx factory]: https://esbuild.github.io/api/#jsx-factory
[jsx fragment]: https://esbuild.github.io/api/#jsx-fragment
