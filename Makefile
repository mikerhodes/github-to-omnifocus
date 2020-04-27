.PHONY: run
run:
	npm run github-to-omnifocus sync

.PHONY: publish
publish:
	npm publish --access public

.PHONY: version-patch
version-patch:
	npm version patch

.PHONY: version-minor
version-minor:
	npm version minor
