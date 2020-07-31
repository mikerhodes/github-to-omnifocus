/**
 * Module omnifocus contains methods that directly access, modify and
 * retrieve data from OmniFocus via macOS OSA scripting automation (JXA).
 */

const osa = require('osa2');

exports.getInboxTasks = osa(() => {
    // @ts-ignore
    var of = Application("OmniFocus")
    of.includeStandardAdditions = true;
    return of.defaultDocument
        .inboxTasks()
        .filter((task) => task.completed() === false)
        .map((task) => {
            return { "id": task.id(), "name": task.name() };
        });
})

exports.ensureTagExists = osa((/** @type {string} */ tagName) => {
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
        return tags.length === 0 ? (
            (
                ofDoc.tags.push(oTag),
                oTag
            )
        ) : tags()[0]
    }
    tagFoundOrCreated(tagName)
});

exports.addNewTask = osa((
    /** @type {string} */ projectName,
    /** @type {string} */ title,
    /** @type {string[]} */ tags,
    /** @type {string} */ taskNote,
    /** @type {integer} date in ms format or null */ dueDateMS,
) => {

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
        .whose({ name: projectName })[0];

    // Unmarshall dueDateMS into JS Date
    var dueDate = null
    if (dueDateMS) {
        dueDate = new Date(dueDateMS)
    }

    var task = ofApp.Task({
        "name": title,
        "note": taskNote,
        "dueDate": dueDate,
    })
    // ofDoc.inboxTasks.push(task)
    project.tasks.unshift(task)
    tags.forEach((t) => {
        ofApp.add(tagFoundOrCreated(t), {
            to: task.tags
        })
    })


    return { "id": task.id(), "name": task.name() };
});

// tasksForProjectWithTag returns tasks in a project with the app and type
// tags specified (i.e., `github-to-omnifocus` and `gh-issue`)
// @param {string[]} tags
// @param {string} projectName
exports.tasksForProjectWithTag = osa((
    /** @type {string} */ projectName,
    /** @type {string[]} */ tags
) => {
    // @ts-ignore
    const ofApp = Application("OmniFocus")
    const ofDoc = ofApp.defaultDocument
    const project = ofDoc.flattenedProjects
        .whose({ name: projectName })[0];

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

    const ofTags = tags.map((t) => {
        return tagFoundOrCreated(t)
    })

    // const ofAppTag = tagFoundOrCreated(appTag)
    // const ofTypeTag = tagFoundOrCreated(typeTag)

    return project.tasks()
        .filter((task) => task.completed() === false)
        .filter((task) => {
            // Task must have all tags
            const tags = task.tags()
            for (var i = 0; i < ofTags.length; i++) {
                if (!tags.some(tag => tag.id() == ofTags[i].id())) {
                    return false
                }
            }
            return true
        })
        .map((task) => {
            return { "id": task.id(), "name": task.name() };
        });
});

exports.markTaskComplete = osa((taskId) => {
    // @ts-ignore
    const ofApp = Application("OmniFocus")
    const task = ofApp.defaultDocument.flattenedTasks().filter(task => task.id() === taskId)
    if (task) {
        // @ts-ignore
        return ofApp.markComplete(task)
    }
    return false
});
