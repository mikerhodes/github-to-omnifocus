.PHONY: run
run:
	npm run github-to-omnifocus sync

.PHONY: publish
publish:
	npm publish --access public
