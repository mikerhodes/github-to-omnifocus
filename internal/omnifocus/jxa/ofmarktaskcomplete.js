// Mark a task complete in OmniFocus
// Accepts a Task as JSON in an OSA_ARGS env var
// Call it:
//   set -gx OSA_ARGS '{"id": "a2g4XFUiQKm"}'
//   osascript -l JavaScript ofmarktaskcomplete.js | jq .

/**
 * @typedef {Object} OmnifocusTask
 * @property {string} id
 * @property {string} name // not used, but here to mirror type on Go side.
 */

function markTaskComplete(
    /** @type {OmnifocusTask} */ t
) {
    // @ts-ignore
    const ofApp = Application("OmniFocus")
    const task = ofApp.defaultDocument.flattenedTasks.whose({ id: t.id })[0]
    if (task) {
        // @ts-ignore
        ofApp.markComplete(task)
        return true
    }
    return false
}


ObjC.import('stdlib')
var args = JSON.parse($.getenv('OSA_ARGS'))
var out = markTaskComplete(args)
JSON.stringify(out)
