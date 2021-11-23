.PHONY: prepare upgrade reset test

# Define colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

## Copy files and install modules
prepare:
	mkdir -p Build/Carbon.Pipeline/
	cp -n Test/pipeline.yaml ./
	cp -n Installer/Distribution/Defaults/{*,.*} ./ || true
	cp -R {Lib,defaults.yaml,*.mjs,*.js} Build/Carbon.Pipeline/
	yarn install

## Check for upgraded packages
upgrade:
	yarn upgrade-interactive --latest
	yes | cp package.json Installer/Distribution/Defaults/package.json

## Run some basic checks
test:
	yarn showConfig
	yarn add esbuild-svelte svelte-preprocess vue vue-template-compiler esbuild-vue sass node-sass-tilde-importer
	yarn build

## Reset files to old state
reset:
	git reset --hard
	git clean -fx
	rm -rf node_modules Build Test/Resources/Public Packages


# define indention for descriptions
TARGET_MAX_CHAR_NUM=10

## Show help
help:
	@echo ''
	@echo '${GREEN}CLI command list of Carbon.Pipeline:${RESET}'
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${YELLOW}%-$(TARGET_MAX_CHAR_NUM)s${RESET} ${GREEN}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
	@echo ''

.DEFAULT_GOAL := help
