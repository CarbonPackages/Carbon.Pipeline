# Carbon.Pipeline

A ultra fast Javascript and CSS Bundler for Neos CMS.

## Add TypeScript

```bash
yarn add --dev typescript
```

Add your `tsconfig.json` file, this is just an example:

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

## Add Svelte

```bash
yarn add --dev svelte svelte-preprocess esbuild-svelte @tsconfig/svelte
```

Enable the plugin in your `pipeline.yaml` file:

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

## Add Vue

```bash
yarn add --dev vue vue-template-compiler esbuild-vue
```

```yaml
esbuild:
  plugins:
    vue:
      enable: true
      # You can pass your needed options here
      # options:
```
