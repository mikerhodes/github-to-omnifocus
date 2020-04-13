'use strict';

const osa = require('osa2');

const getInboxTasks = osa(() => {
    var of = Application("OmniFocus")
    of.includeStandardAdditions = true;
    return of.defaultDocument
        .inboxTasks()
        .filter((task) => task.completed() === false)
        .map((task) => { return { "id": task.id(), "name": task.name() }; })
})

const newTask = osa((title) => {

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

    var task = ofApp.Task({
        "name": title,
        "primaryTag": tagFoundOrCreated("github")
    })
    ofDoc.inboxTasks.push(task)
    // var task = ofDoc.parseTasksInto({ withTransportText: "my task | foo @tags(github)", asSingleTask: true })[0]
    return { "id": task.id(), "name": task.name() };
});


function main() {
    // getInboxTasks().then(result => console.log(result))
    newTask("my task")
        .then(result => console.log(result))
        .catch(console.log("Error adding task"))
}

main()
