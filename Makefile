.PHONY: prepare check-for-upgrades reset test-pnpm test-yarn test-npm test-all

# Define colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

## Copy files
prepare:
	@mkdir -p Build/Carbon.Pipeline/
	@cp -n Test/pipeline.yaml ./
	@cp -n RootFiles/Global/{*,.*} ./ || true
	@cp -n RootFiles/JavaScript/{*,.*} ./ || true
	@cp -n RootFiles/TailwindCSS/{*,.*} ./ || true
	@cp -R {Lib,defaults.yaml,*.mjs,*.cjs} Build/Carbon.Pipeline/
	@npm pkg set "scripts.build"="concurrently -r 'pnpm:build:*'"

## Check for upgraded packages with pnpm
check-for-upgrades:
	@pnpm setPackageManager pnpm
	@pnpm up --interactive --latest
	@yes | cp package.json RootFiles/JavaScript/package.json
	@pnpm add -D typescript-eslint
	@yes | cp package.json RootFiles/TypeScript/package.json
	@pnpm remove typescript-eslint

## Run some basic checks with pnpm
test-pnpm:
	@rm -rf node_modules
	@pnpm setPackageManager pnpm
	@pnpm install
	@pnpm add tailwindcss svelte svelte-preprocess esbuild-svelte sass node-sass-tilde-importer
	@pnpm showConfig
	@pnpm build

## Run some basic checks with yarn
test-yarn:
	@rm -rf node_modules
	@yarn setPackageManager yarn
	@yarn set version stable
	@yarn install
	@yarn add tailwindcss svelte svelte-preprocess esbuild-svelte sass node-sass-tilde-importer
	@yarn showConfig
	@yarn build

## Run some basic checks with npm
test-npm:
	@rm -rf node_modules
	@npm setPackageManager npm
	@npm install
	@npm add tailwindcss svelte svelte-preprocess esbuild-svelte sass node-sass-tilde-importer
	@npm run showConfig
	@npm run build

## Run some basic checks with pnpm, yarn and npm
test-all:
	@make test-pnpm
	@make test-yarn
	@make test-npm

## Reset files to old state
reset:
	@git reset --hard
	@git clean -fx
	@rm -rf node_modules Build Test/Resources/Public Packages .yarn


# define indention for descriptions
TARGET_MAX_CHAR_NUM=18

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
