.PHONY: upgrade release login

## Upgrade dependencies to the latest version
upgrade:
	COREPACK_ENABLE_AUTO_PIN=0 pnpm upgrade --latest
	COREPACK_ENABLE_AUTO_PIN=0 pnpm up --latest --interactive

## Login to npm with web authentication
login:
	npm login --auth-type=web command

## Release the package to npm
release:
	rm -rf node_modules
	COREPACK_ENABLE_AUTO_PIN=0 pnpm publish --access public --no-git-checks

# Define colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

# define indention for descriptions
TARGET_MAX_CHAR_NUM=8

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
