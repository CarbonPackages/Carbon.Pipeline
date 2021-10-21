.PHONY: prepare upgrade reset test

prepare: ## Copy files and install modules
	mkdir -p Build/Carbon.Pipeline/
	cp -n Test/pipeline.yaml ./
	cp -n Installer/Distribution/Defaults/{*,.*} ./ || true
	cp -R {Lib,defaults.yaml,*.mjs,*.js} Build/Carbon.Pipeline/
	yarn install

upgrade: ## Check for upgraded packages
	yarn upgrade-interactive --latest
	yes | cp package.json Installer/Distribution/Defaults/package.json

test: ## Run some basic checks
	yarn showConfig
	yarn add esbuild-svelte svelte-preprocess vue vue-template-compiler esbuild-vue sass node-sass-tilde-importer
	yarn build

reset: ## Reset files to old state
	git reset --hard
	git clean -fx
	rm -rf node_modules Build Test/Resources/Public

help:
	@echo ""
	@echo "    Command list:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[36m%-10s\033[0m %s\n", $$1, $$2}'
	@echo ""

.DEFAULT_GOAL := help
