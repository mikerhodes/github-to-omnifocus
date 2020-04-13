'use strict';

const osa = require('osa2');

const getInboxTasks = osa(() => {
    var of = Application("OmniFocus")
    of.includeStandardAdditions = true;
    return of.defaultDocument
        .inboxTasks()
        .filter((task) => task.completed() === false)
        .map((task) => {
            return { "id": task.id(), "name": task.name() };
        });
})

const newTask = osa((projectName, title, tag) => {

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
        "primaryTag": tagFoundOrCreated(tag)
    })
    // ofDoc.inboxTasks.push(task)
    project.tasks.push(task)
    // var task = ofDoc.parseTasksInto({ withTransportText: "my task | foo @tags(github)", asSingleTask: true })[0]
    return { "id": task.id(), "name": task.name() };
});

const tasksForProject = osa((projectName) => {
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


function main() {
    // getInboxTasks().then(result => console.log(result))

    // newTask('GitHub Issues', "my task", "github")
    //     .then(result => console.log(result))
    //     .catch(console.log("Error adding task"))

    // tasksForProject('GitHub Issues')
    //     .then(result => result.forEach(t => console.log(t)));
}

main()
