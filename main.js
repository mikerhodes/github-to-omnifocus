'use strict';

const osa = require('osa2');
const toml = require('toml');
const fs = require('fs')
const { Octokit } = require("@octokit/rest");
const os = require('os')

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

const addNewTask = osa((projectName, title, tag, taskNote) => {

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

const markTaskComplete = osa((taskId) => {
    const task = Application('OmniFocus').defaultDocument.flattenedTasks().filter(task => task.id() === taskId)
    if (task) {
        return Application('OmniFocus').markComplete(task)
    }
    return false
});


async function main() {

    var tomlConfig, config

    var configFilePath = `${os.homedir()}/.github-to-omnifocus.toml`
    console.log(`Reading config at ${configFilePath}...`)

    try {
        tomlConfig = fs.readFileSync(configFilePath, 'utf8')
    } catch (err) {
        console.error(err)
        process.exit(1)
    }

    try {
        config = toml.parse(tomlConfig);
    } catch (e) {
        console.error("Parsing error on line " + e.line + ", column " + e.column +
            ": " + e.message);
        process.exit(1)
    }

    console.log("Config loaded.")
    console.log(`Using API server: ${config.github.api_url}`);
    console.log(`Using token: ${config.github.auth_token}`);

    const octokit = new Octokit({
        auth: config.github.auth_token, // token
        userAgent: "github-to-omnifocus/1.0.0",
        baseUrl: config.github.api_url,
        log: console,
    })

    // Get issues and transform to standard form for tasks in "GitHub Issues" project
    try {
        const prefix = iss => iss.repository.full_name + "#" + iss.number
        const results = await octokit.issues.list({
            filter: "assigned",
            state: "open"
        })
        const issues = results.data.map(iss => {
            return {
                prefix: prefix(iss),
                title: `${prefix(iss)} ${iss.title}`,
                body: iss.html_url,
            }
        })

        console.log(`Found ${issues.length} assigned issues.`)

        const tasks = await tasksForProject('GitHub Issues')

        await addNewIssues('GitHub Issues', tasks.map(t => t.name), issues)
        console.log("Issues added!")

        await completeMissingIssues(tasks, issues)
        console.log("Issues removed!")

    } catch (err) {
        console.error(err)
    }

    // Get PRs and transform to standard form for tasks in "GitHub PRs" project
    try {
        const prefix = t => { // pull the org and repo from the html_url via regex
            const m = t.html_url.match(/^https:\/\/github[^\0]ibm[^\0]com\/([^\/]+)\/([^\/]+)/m)
            return `${m[1]}/${m[2]}#${t.number}`
        }
        const results = await octokit.search.issuesAndPullRequests({
            q: "type:pr org:cloudant state:open review-requested:mike-rhodes",
        });
        const prs = results.data.items.map(pr => {
            return {
                prefix: prefix(pr),
                title: `${prefix(pr)} ${pr.title}`,
                body: pr.html_url,
            }
        })

        console.log(`Found ${prs.length} assigned PRs.`)

        const tasks = await tasksForProject('GitHub PRs')

        await addNewIssues('GitHub PRs', tasks.map(t => t.name), prs)
        console.log("PRs added!")

        await completeMissingIssues(tasks, prs)
        console.log("PRs removed!")
    } catch (err) {
        console.error(err)
    }
}

/**
 * addNewIssues makes new tasks for `issues` which have no task in
 * `currentTasks`.
 * @param {object} currentTasks {id, name}
 * @param {object} issues {
                prefix: prefix(x),
                title: taskTitle(x),
                body: taskBody(x),
            }
 */
async function addNewIssues(omnifocusProject, currentTasks, issues) {

    try {
        // Filter down list of active assigned issues to those which do
        // not have a corresponding task (via prefix matching). Add these
        // issues as new tasks.
        const addTaskPromises = issues
            .filter(iss => {
                return !currentTasks.some(e => e.startsWith(iss.prefix))
            })
            .map(iss => {
                console.log("Adding issue: " + iss.prefix)
                return addNewTask(omnifocusProject, iss.title, "github", iss.body)
            })

        console.log("Waiting for " + addTaskPromises.length + " tasks to be added...")
        return Promise.all(addTaskPromises)

    } catch (err) {
        console.error(err.message)
    }
}

/**
 * completeMissingIssues marks tasks in `currentTasks` complete which have
 * no corresponding issue in `issues`.
 * @param {object} currentTasks {id, name}
 * @param {object} issues {
                prefix: prefix(x),
                title: taskTitle(x),
                body: taskBody(x),
            }
 */
async function completeMissingIssues(currentTasks, issues) {

    // Generate list of prefixes that we use for tasks within
    // OmniFocus, which will allow us to figure out which tasks
    // are no longer in issues, so we can remove them.
    const issuePrefixes = issues.map(iss => iss.prefix)

    try {
        // Filter down to list of tasks where there is no corresponding
        // issue currently assigned to us via prefix matching, then
        // mark them complete.
        var removeTaskPromises = currentTasks
            .filter((t) => !issuePrefixes.some(e => t.name.startsWith(e)))
            .map((t) => {
                console.log("Mark complete: " + t.name)
                markTaskComplete(t.id)
            })

        console.log(`Waiting for ${removeTaskPromises.length} tasks to be completed...`)
        return Promise.all(removeTaskPromises)
    } catch (err) {
        console.log(err);
    }
}

main()
