#!/usr/bin/env node

//@ts-check
'use strict';

const url = require('url');

const { Octokit } = require("@octokit/rest");

const configuration = require('./configuration')
const omnifocus = require('./omnifocus')

// PotentialTask is the internal representation of a potential task
// to be added to OmniFocus.
class PotentialTask {
    constructor() {
        /** @type {string} */
        this.prefix;
        /** @type {string} */
        this.title;
        /** @type {string} */
        this.body;
    }
}

// CurrentTask is the internal representation of a current task
// from OmniFocus.
class CurrentTask {
    constructor() {
        /** @type {string} */
        this.id;
        /** @type {string} */
        this.title;
    }
}


async function run() {

    console.log(`Starting github-to-omnifocus ${require('../package.json').version}.`)

    const c = configuration.loadConfig()

    if (!c.github.auth_token) {
        console.log("Error: no GitHub token found in config file; exiting.")
        process.exit(1)
    }

    const octokit = new Octokit({
        auth: c.github.auth_token, // token
        userAgent: `github-to-omnifocus/${process.env.npm_package_version}`,
        baseUrl: c.github.api_url,
        // log: console,
    })

    console.log("Ensuring github-to-omnifocus tags exist...")
    await omnifocus.ensureTagExists(c.omnifocus.app_tag)
    await omnifocus.ensureTagExists(c.omnifocus.assigned_tag)
    await omnifocus.ensureTagExists(c.omnifocus.review_tag)
    console.log("Tags added.")

    // Get issues and transform to standard form for tasks in "GitHub Issues" project
    // TODO use octokit's paginate to get more than 30 results
    try {
        const results = await octokit.issues.list({
            filter: "assigned",
            state: "open"
        })
        const issues = results.data.map(iss => {
            const prefix = iss.repository.full_name + "#" + iss.number
            const potentialTask = new PotentialTask()
            potentialTask.prefix = prefix
            potentialTask.title = `${prefix} ${iss.title}`
            potentialTask.body = iss.html_url
            return potentialTask
        })

        console.log(`Found ${issues.length} assigned issues.`)

        var tasks = await omnifocus.tasksForProjectWithTag(
            c.omnifocus.assigned_project,
            c.omnifocus.app_tag,
            c.omnifocus.assigned_tag)
        tasks = tasks.map(t => {
            const task = new CurrentTask()
            task.id = t.id
            task.title = t.name
            return task
        })

        await addNewIssues(c.omnifocus.assigned_project,
            c.omnifocus.app_tag,
            c.omnifocus.assigned_tag,
            tasks,
            issues)
        console.log("Issues added!")

        await completeMissingIssues(tasks, issues)
        console.log("Issues removed!")

    } catch (err) {
        console.error(err)
    }

    // Get PRs and transform to standard form for tasks in "GitHub PRs" project
    // TODO use octokit's paginate to get more than 30 results
    try {
        const user = await octokit.users.getAuthenticated()
        const username = user.data.login
        const prefix = t => {
            // pull the owner and repo from the html_url assuming host is root
            // of GitHub instance (may not be the case for all GitHub Enterprise
            // installs).
            // I.e., we assume https://github.com/:OWNER/:REPO
            const parts = url.parse(t.html_url).pathname.split("/")
            return `${parts[1]}/${parts[2]}#${t.number}`
        }
        const results = await octokit.search.issuesAndPullRequests({
            q: `type:pr state:open review-requested:${username}`,
        });
        const prs = results.data.items.map(pr => {
            const potentialTask = new PotentialTask()
            potentialTask.prefix = prefix(pr)
            potentialTask.title = `${prefix(pr)} ${pr.title}`
            potentialTask.body = pr.html_url
            return potentialTask
        })

        console.log(`Found ${prs.length} PRs to review.`)

        var tasks = await omnifocus.tasksForProjectWithTag(
            c.omnifocus.review_project,
            c.omnifocus.app_tag,
            c.omnifocus.review_tag)
        tasks = tasks.map(t => {
            const task = new CurrentTask()
            task.id = t.id
            task.title = t.name
            return task
        })

        await addNewIssues(
            c.omnifocus.review_project,
            c.omnifocus.app_tag,
            c.omnifocus.review_tag,
            tasks,
            prs)
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
 * @param {string} [omnifocusProject]
 * @param {string} ofTag
 * @param {CurrentTask[]} [currentTasks] {id, name}
 * @param {PotentialTask[]} [issues]
 */
async function addNewIssues(omnifocusProject, ofTag, ofTypeTag, currentTasks, issues) {

    try {
        // Filter down list of active assigned issues to those which do
        // not have a corresponding task (via prefix matching). Add these
        // issues as new tasks.
        const addTaskPromises = issues
            .filter(iss => {
                return !currentTasks.some(e => e.title.startsWith(iss.prefix))
            })
            .map(iss => {
                console.log("Adding issue: " + iss.prefix)
                return omnifocus.addNewTask(omnifocusProject, iss.title, ofTag, ofTypeTag, iss.body)
            })

        console.log("Waiting for " + addTaskPromises.length + " tasks to be added...")
        await Promise.all(addTaskPromises)

    } catch (err) {
        console.error(err.message)
    }
}

/**
 * completeMissingIssues marks tasks in `currentTasks` complete which have
 * no corresponding issue in `issues`.
 * @param {CurrentTask[]} [currentTasks] {id, name}
 * @param {PotentialTask[]} [issues]
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
            .filter((t) => !issuePrefixes.some(e => t.title.startsWith(e)))
            .map((t) => {
                console.log("Mark complete: " + t.title)
                return omnifocus.markTaskComplete(t.id)
            })

        console.log(`Waiting for ${removeTaskPromises.length} tasks to be completed...`)
        await Promise.all(removeTaskPromises)
    } catch (err) {
        console.log(err);
    }
}

exports.sync = () => run()
