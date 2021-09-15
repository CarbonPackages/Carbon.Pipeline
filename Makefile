.PHONY: default prepare upgrade reset test

default:
	@echo ""
	@echo ""
	@echo "      Usage: make COMMAND"
	@echo ""
	@echo ""
	@echo "    prepare     Copy files and install modules"
	@echo "    upgrade     Check for upgraded packages"
	@echo "    test        Run some basic checks"
	@echo "    reset       Reset files to old state"
	@echo ""
	@echo ""

prepare:
	mkdir -p Build/Carbon.Pipeline/
	cp -n Test/pipeline.yaml ./
	cp -n Installer/Distribution/Defaults/{*,.*} ./ || true
	cp -R {Lib,defaults.yaml,*.mjs,*.js} Build/Carbon.Pipeline/
	yarn install

upgrade:
	make prepare
	yarn upgrade-interactive --latest
	yes | cp package.json Installer/Distribution/Defaults/package.json

test:
	make prepare
	yarn showConfig
	yarn add esbuild-svelte svelte-preprocess vue vue-template-compiler esbuild-vue sass node-sass-tilde-importer
	yarn build

reset:
	git reset --hard
	git clean -fx
	rm -rf node_modules Build Test/Resources/Public
