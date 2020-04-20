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

exports.ensureTagExists = osa((tagName) => {
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

exports.addNewTask = osa((projectName, title, appTag, typeTag, taskNote) => {

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

    const ofAppTag = tagFoundOrCreated(appTag)
    const ofTypeTag = tagFoundOrCreated(typeTag)

    var task = ofApp.Task({
        "name": title,
        "note": taskNote
    })
    // ofDoc.inboxTasks.push(task)
    project.tasks.unshift(task)
    ofApp.add(ofAppTag, {
        to: task.tags
    })
    ofApp.add(ofTypeTag, {
        to: task.tags
    })
    return { "id": task.id(), "name": task.name() };
});

// tasksForProjectWithTag returns tasks in a project with the app and type
// tags specified (i.e., `github-to-omnifocus` and `gh-issue`)
exports.tasksForProjectWithTag = osa((projectName, appTag, typeTag) => {
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

    const ofAppTag = tagFoundOrCreated(appTag)
    const ofTypeTag = tagFoundOrCreated(typeTag)

    return project.tasks()
        .filter((task) => task.completed() === false)
        .filter((task) => {
            const tags = task.tags()
            return tags.some(tag => tag.id() == ofAppTag.id())
        })
        .filter((task) => {
            const tags = task.tags()
            return tags.some(tag => tag.id() == ofTypeTag.id())
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
