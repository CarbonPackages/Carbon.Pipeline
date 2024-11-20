.PHONY: upgrade release

upgrade:
	COREPACK_ENABLE_AUTO_PIN=0 pnpm upgrade --latest
	COREPACK_ENABLE_AUTO_PIN=0 pnpm up --latest --interactive

release:
	rm -rf node_modules
	COREPACK_ENABLE_AUTO_PIN=0 pnpm publish --access public --no-git-checks
