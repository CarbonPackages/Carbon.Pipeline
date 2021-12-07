.PHONY: prepare up-lock up-pnpm up-yarn up-npm up-copy reset test-pnpm test-yarn test-npm

# Define colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

## Copy files
prepare:
	@mkdir -p Build/Carbon.Pipeline/
	@cp -n Test/pipeline.yaml ./
	@cp -n Installer/Distribution/Defaults/{*,.*} ./ || true
	@cp -R {Lib,defaults.yaml,*.mjs,*.js} Build/Carbon.Pipeline/

## Update lock files
up-lock:
	@echo "${GREEN}Writing lock files...${RESET}"
	@rm -rf node_modules yarn.lock pnpm-lock.yaml package-lock.json
	@pnpm install
	@rm -rf node_modules
	@yarn install
	@rm -rf node_modules
	@npm install 

## Check for upgraded packages with pnpm 
up-pnpm:
	@pnpm up --interactive --latest

## Check for upgraded packages with yarn 
up-yarn:
	@yarn upgrade-interactive --latest

## Check for upgraded packages with npm
up-npm:
	@npm update

## Copy the root package.json to the build directory
up-copy:
	@yes | cp package.json Installer/Distribution/Defaults/package.json

## Run some basic checks with pnpm
test-pnpm:
	@rm -rf node_modules
	@sed -Ei '' 's/"packageManager": "[a-z]+"/"packageManager": "pnpm"/' package.json
	@pnpm add svelte svelte-preprocess esbuild-svelte vue vue-template-compiler esbuild-vue sass node-sass-tilde-importer
	@pnpm showConfig
	@pnpm build

## Run some basic checks with yarn
test-yarn:
	@rm -rf node_modules
	@sed -Ei '' 's/"packageManager": "[a-z]+"/"packageManager": "yarn"/' package.json
	@yarn add svelte svelte-preprocess esbuild-svelte vue vue-template-compiler esbuild-vue sass node-sass-tilde-importer
	@yarn showConfig
	@yarn build

## Run some basic checks with npm
test-npm:
	@rm -rf node_modules
	@sed -Ei '' 's/"packageManager": "[a-z]+"/"packageManager": "npm"/' package.json
	@npm add svelte svelte-preprocess esbuild-svelte vue vue-template-compiler esbuild-vue sass node-sass-tilde-importer
	@npm run showConfig
	@npm run build

## Reset files to old state
reset:
	@git reset --hard
	@git clean -fx
	@rm -rf node_modules Build Test/Resources/Public Packages


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
