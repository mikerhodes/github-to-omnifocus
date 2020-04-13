const osa = require('osa2');

const getInboxTasks = osa(() => {
    var om = Application("OmniFocus")
    return om.defaultDocument
        .inboxTasks()
        .filter((task) => task.completed() === false)
        .map((task) => { return { "id": task.id(), "name": task.name() }; })
})


const markComplete = osa((taskId) => {
    var om = Application("OmniFocus")
    const task = om.defaultDocument
        .flattenedTasks()
        .filter(task => task.id() === taskId)
    if (task) {
        return Application('OmniFocus').markComplete(task)
    }
    return false
});

const markIncomplete = osa((taskId) => {
    var om = Application("OmniFocus")
    const task = om.defaultDocument
        .flattenedTasks()
        .filter(task => task.id() === taskId)
    if (task) {
        return Application('OmniFocus').markIncomplete(task)
    }
    return false
});

const newTask = osa(() => {
    var of = Application("OmniFocus")
    var t = of.Task({ "name": "my task" }) // "primaryTag": of.Tag({ "name": "github" }) })
    of.defaultDocument.tasks.push(t)
    // var task = of.defaultDocument.parseTasksInto({ withTransportText: "my task | foo @tags(github)", asSingleTask: true })[0]
    // return { "id": task.id(), "name": task.name() };
});


function main() {
    // getInboxTasks().then(result => console.log(result))
    newTask().then(result => console.log(result)).catch(console.log("Error adding task"))
}

main()
