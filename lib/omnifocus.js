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

exports.addNewTask = osa((projectName, title, tag, taskNote) => {

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

    var task = ofApp.Task({
        "name": title,
        "primaryTag": tagFoundOrCreated(tag),
        "note": taskNote,
    })
    // ofDoc.inboxTasks.push(task)
    project.tasks.push(task)
    return { "id": task.id(), "name": task.name() };
});

exports.tasksForProject = osa((projectName) => {
    // @ts-ignore
    const ofApp = Application("OmniFocus")
    const ofDoc = ofApp.defaultDocument
    const project = ofDoc.flattenedProjects
        .whose({ name: projectName })[0];

    return project.tasks()
        .filter((task) => task.completed() === false)
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