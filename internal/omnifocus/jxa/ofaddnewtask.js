// Add a new task to Omnifocus
// Accepts a OmnifocusTask object as JSON in OSA_ARGS
// Call it:
//   set -gx OSA_ARGS '{"projectName": "GitHub Reviews", "name": "task title", "tags": ["github"], "note": "a note", "dateDueMS": 100}'
//   osascript -l JavaScript ofaddnewtask.js | jq .
// Returns JSON:
// {
//  "id": "k9TCngde98W",
//  "name": "task title"
// }

/**
 * @typedef {Object} NewOmnifocusTask
 * @property {string} projectName
 * @property {string} name
 * @property {string[]} tags
 * @property {string} note
 * @property {integer} dueDateMS
 */


function addNewTask(
    /** @type {NewOmnifocusTask} */ t
) {
    console.log(t.note)

    // @ts-ignore
    const ofApp = Application("OmniFocus")
    const ofDoc = ofApp.defaultDocument

    // https://discourse.omnigroup.com/t/automatically-flag-tasks-in-specific-projects-contexts-according-to-due-defer-date/32093/28
    const tagFoundOrCreated = charTag => {
        const
            tags = ofDoc.flattenedTags.whose({
                name: charTag
            }),
            oTag = ofApp.Tag({
                name: charTag
            });
        return tags.length === 0 ? (
            (
                ofDoc.tags.push(oTag),
                oTag
            )
        ) : tags()[0]
    }

    const project = ofDoc.flattenedProjects
        .whose({ name: t.projectName })[0];

    // Unmarshall dueDateMS into JS Date
    var dueDate = null
    if (t.dueDateMS) {
        dueDate = new Date(t.dueDateMS)
    }

    var task = ofApp.Task({
        "name": t.name,
        "note": t.note,
        "dueDate": dueDate,
    })
    // ofDoc.inboxTasks.push(task)
    project.tasks.unshift(task)
    t.tags.forEach((t) => {
        ofApp.add(tagFoundOrCreated(t), {
            to: task.tags
        })
    })


    return { "id": task.id(), "name": task.name() };
}

ObjC.import('stdlib')
var args = JSON.parse($.getenv('OSA_ARGS'))
var out = addNewTask(args)
JSON.stringify(out)
