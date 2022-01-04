// Ensure a tag exists within Omnifocus
// Accepts a Tag as JSON in an OSA_ARGS env var.
// Call it:
//   set -gx OSA_ARGS '{"name":"github"}'
//   osascript -l JavaScript ofensuretagexists.js | jq .
// Returns nothing.

/**
 * @typedef {Object} Tag
 * @property {string} name
 */

function ensureTagExists(/** @type {Tag} */ tag) {
    const ofApp = Application("OmniFocus")
    const ofDoc = ofApp.defaultDocument
    const tagFoundOrCreated = charTag => {
        const
            tags = ofDoc.flattenedTags.whose({
                name: charTag
            }),
            oTag = ofApp.Tag({
                name: charTag
            });

        if (tags.length === 0) {
            ofDoc.tags.push(oTag)
            return oTag.name
        } else {
            return tags()[0]
        }
    }
    tagFoundOrCreated(tag.name)
}

ObjC.import('stdlib')
var args = JSON.parse($.getenv('OSA_ARGS'))
var out = ensureTagExists(args)
JSON.stringify(out)
