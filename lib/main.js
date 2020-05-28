#!/usr/bin/env node

//@ts-check
'use strict';

const url = require('url');

const { Octokit } = require("@octokit/rest");

const configuration = require('./configuration')
const omnifocus = require('./omnifocus')

const log = (/** @type {string} */ line) => console.log(`[${new Date().toISOString()}] ${line}`)

/**
 * @typedef {Object} OmnifocusTask - creates a new type named 'OmnifocusTask'
 * @property {string} id
 * @property {string} name
 */

/** @typedef {{ number: Number, html_url: string}} IssueLike */

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

// NotificationSummary represents the information we need from a notification
// object to process the notification and add to OmniFocus.
class NotificationSummary {
    constructor() {
        /** @type {string} */
        this.prefix;
        /** @type {string} */
        this.owner;
        /** @type {string} */
        this.repo;
        /** @type {Number} */
        this.issue_number;
        /** @type {string} */
        this.type;
        /** @type {string} */
        this.commentId;
        /** @type{string} Either the issue/PR URL or latest comment URL */
        this.htmlUrl;
        /** @type {string} Issue or PR title */
        this.issueTitle;
    }
}


async function run() {

    const app_version = require('../package.json').version

    log(`Starting github-to-omnifocus ${app_version}.`)

    const c = configuration.load()

    if (!c.github.auth_token) {
        log("Error: no GitHub token found in config file; exiting.")
        process.exit(1)
    }

    const octokit = new Octokit({
        auth: c.github.auth_token, // token
        userAgent: `github-to-omnifocus/${app_version}`,
        baseUrl: c.github.api_url,
        // log: console,
    })

    log("Ensuring github-to-omnifocus tags exist...")
    await omnifocus.ensureTagExists(c.omnifocus.app_tag)
    await omnifocus.ensureTagExists(c.omnifocus.assigned_tag)
    await omnifocus.ensureTagExists(c.omnifocus.review_tag)
    await omnifocus.ensureTagExists(c.omnifocus.notification_tag)
    log("Tags added.")

    await syncNotifications(octokit, c)
    await syncAssignedItems(octokit, c)
    await syncReviewItems(octokit, c)
}

/**
 * processNotifications syncs GitHub notifications into tasks
 *
 * @param {InstanceType<typeof Octokit> } octokit
 * @param {configuration.Config} c
 */
async function syncNotifications(octokit, c) {
    try {
        log("Processing notifications...")

        // https://octokit.github.io/rest.js/v17/#activity-list-notifications-for-authenticated-user
        const notifications = await octokit.activity.listNotificationsForAuthenticatedUser();

        /** @type {NotificationSummary[]} */
        const prefixes = []
        for (var i = 0; i < notifications.data.length; i++) {
            const n = notifications.data[i]
            // n.subject.url is ${baseUrl}/repos/cloudant/infra/issues/1500
            var parts = n.subject.url.split("/")
            const issue_number = parts.pop()
            const type = parts.pop()
            const repo = parts.pop()
            const owner = parts.pop()

            // ${baseUrl}/repos/cloudant/infra/issues/comments/20486062
            // If there is a comment ID, we can later use this to pull the
            // HTML URL direct to that comment rather than just the issue.
            var commentId = ""
            if (n.subject.latest_comment_url) {
                commentId = n.subject.latest_comment_url.split("/").pop()
            }

            prefixes.push({
                prefix: `${owner}/${repo}#${issue_number}`,
                owner,
                repo,
                issue_number: Number(issue_number),
                type,
                commentId,
                htmlUrl: null,
                issueTitle: n.subject.title
            })
        }
        log(`Found ${prefixes.length} items on GitHub.`)

        /** @type {OmnifocusTask[]} */
        var ofTasks = await omnifocus.tasksForProjectWithTag(
            c.omnifocus.notification_project,
            [c.omnifocus.app_tag, c.omnifocus.notification_tag])
        const existingTasks = ofTasks.map(t => {
            const task = new CurrentTask()
            task.id = t.id
            task.title = t.name
            return task
        })
        log(`Found ${existingTasks.length} tasks in Omnifocus.`)

        // We can immediately mark complete any items that
        // notifications don't have corresponding prefixes for.
        await completeMissingIssues(existingTasks, prefixes.map(x => x.prefix))

        // We have to reach out to GitHub for each new task to find the full
        // information for the task (specifically to work out the right HTML URL
        // as the API one isn't useful from a browser), we filter down the
        // notification summaries to just those which are new to avoid waiting
        // for unnecessary network requests.
        const newSummaries = prefixes.filter((p) => {
            return !existingTasks.some((t) => t.title.startsWith(p.prefix))
        });

        // Find the HTML URL for each summary. A notification may include a
        // link to the latest comment on its referenced issue or PR. We have
        // to reach back out to GitHub to get the actual comment or issue to
        // find its HTML rather than API URL.
        // - Get the comment's URL if there is one so the link can go
        //     directly to the earliest unread comment.
        // - Otherwise fall back to the Issue or PR URL.
        const requests = newSummaries.map(async (summary) => {
            if (summary.commentId) {
                // https://octokit.github.io/rest.js/v17#issues-get-comment
                const x = await octokit.issues.getComment({
                    owner: summary.owner,
                    repo: summary.repo,
                    comment_id: Number(summary.commentId)
                });
                summary.htmlUrl = x.data.html_url;
            } else {
                // https://octokit.github.io/rest.js/v17#issues-get
                const x = await octokit.issues.get({
                    owner: summary.owner,
                    repo: summary.repo,
                    issue_number: summary.issue_number
                });
                summary.htmlUrl = x.data.html_url;
            }

            return summary;
        })
        // As the promises complete, the summary.htmlUrl will be filled for
        // each, so we have to await them all before continuing
        const issues = await Promise.all(requests)

        // Map notification summaries into the data structure for creating tasks
        const potentialTasks = issues.map(x => {
            /** @type {PotentialTask} */
            const r = {
                prefix: x.prefix,
                title: `${x.prefix} ${x.issueTitle}`,
                body: x.htmlUrl
            }
            return r;
        })

        await addNewIssues(c.omnifocus.notification_project,
            [c.omnifocus.app_tag, c.omnifocus.notification_tag],
            existingTasks,
            potentialTasks)

    } catch (err) {
        console.error(err);
    }

}

/**
 * processAssignedItems syncs GitHub assigned items into tasks
 *
 * @param {InstanceType<typeof Octokit> } octokit
 * @param {configuration.Config} c
 */
async function syncAssignedItems(octokit, c) {
    // Get issues and transform to standard form for tasks in "GitHub Issues" project
    // TODO use octokit's paginate to get more than 30 results
    try {
        log("Processing assigned issues and PRs...")

        const results = await octokit.issues.list({
            filter: "assigned",
            state: "open"
        })
        /** @type {PotentialTask[]} */
        const issues = results.data.map(iss => {
            const prefix = iss.repository.full_name + "#" + iss.number
            const potentialTask = new PotentialTask()
            potentialTask.prefix = prefix
            potentialTask.title = `${prefix} ${iss.title}`
            potentialTask.body = iss.html_url
            return potentialTask
        })

        log(`Found ${issues.length} items on GitHub.`)

        /** @type {OmnifocusTask[]} */
        var ofTasks = await omnifocus.tasksForProjectWithTag(
            c.omnifocus.assigned_project,
            [c.omnifocus.app_tag, c.omnifocus.assigned_tag])
        const tasks = ofTasks.map(t => {
            const task = new CurrentTask()
            task.id = t.id
            task.title = t.name
            return task
        })
        log(`Found ${tasks.length} tasks in Omnifocus.`)

        await addNewIssues(c.omnifocus.assigned_project,
            [c.omnifocus.app_tag, c.omnifocus.assigned_tag],
            tasks,
            issues)

        await completeMissingIssues(tasks, issues.map(x => x.prefix))

    } catch (err) {
        console.error(err)
    }
}

/**
 * processAssignedItems syncs GitHub reviewable items into tasks
 *
 * @param {InstanceType<typeof Octokit> } octokit
 * @param {configuration.Config} c
 */
async function syncReviewItems(octokit, c) {
    // Get PRs and transform to standard form for tasks in "GitHub PRs" project
    // TODO use octokit's paginate to get more than 30 results
    try {
        log("Processing requested reviews...")

        const user = await octokit.users.getAuthenticated()
        const username = user.data.login
        const prefix = (/** @type IssueLike */ t) => {
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

        log(`Found ${prs.length} items on GitHub.`)

        /** @type {OmnifocusTask[]} */
        var ofTasks = await omnifocus.tasksForProjectWithTag(
            c.omnifocus.review_project,
            [c.omnifocus.app_tag, c.omnifocus.review_tag])
        const tasks = ofTasks.map(t => {
            const task = new CurrentTask()
            task.id = t.id
            task.title = t.name
            return task
        })
        log(`Found ${tasks.length} tasks in Omnifocus.`)

        await addNewIssues(
            c.omnifocus.review_project,
            [c.omnifocus.app_tag, c.omnifocus.review_tag],
            tasks,
            prs)

        await completeMissingIssues(tasks, prs.map(x => x.prefix))
    } catch (err) {
        console.error(err)
    }
}

/**
 * addNewIssues makes new tasks for `issues` which have no task in
 * `currentTasks`.
 * @param {string} omnifocusProject
 * @param {string[]} tags
 * @param {CurrentTask[]} currentTasks {id, name}
 * @param {PotentialTask[]} issues
 */
async function addNewIssues(omnifocusProject, tags, currentTasks, issues) {

    try {
        // Filter down list of active assigned issues to those which do
        // not have a corresponding task (via prefix matching). Add these
        // issues as new tasks.
        const addTaskPromises = issues
            .filter(iss => {
                return !currentTasks.some(e => e.title.startsWith(iss.prefix))
            })
            .map(iss => {
                log("Adding task for: " + iss.prefix)
                return omnifocus.addNewTask(omnifocusProject, iss.title, tags, iss.body)
            })

        if (addTaskPromises.length > 0) {
            log("Found " + addTaskPromises.length + " new tasks; adding...")
            await Promise.all(addTaskPromises)
            log("done.")
        } else {
            log("No new tasks.")
        }
    } catch (err) {
        console.error(err.message)
    }
}

/**
 * completeMissingIssues marks tasks in `currentTasks` complete which have
 * no corresponding prefix in `prefixes` for their title. (github-to-omnifocus
 * uses the the Github OWNER/REPO#NUMBER as task prefixes so it can recognise
 * existing tasks).
 * @param {CurrentTask[]} [currentTasks] {id, name}
 * @param {string[]} [prefixes]
 */
async function completeMissingIssues(currentTasks, prefixes) {

    try {
        // Filter down to list of tasks where there is no corresponding
        // issue currently assigned to us via prefix matching, then
        // mark them complete.
        var removeTaskPromises = currentTasks
            .filter((t) => !prefixes.some(e => t.title.startsWith(e)))
            .map((t) => {
                log("Mark complete: " + t.title)
                return omnifocus.markTaskComplete(t.id)
            })

        if (removeTaskPromises.length > 0) {
            log("Found " + removeTaskPromises.length + " obsolete tasks; completing...")
            await Promise.all(removeTaskPromises)
            log("done.")
        } else {
            log("No tasks to complete.")
        }
    } catch (err) {
        log(err);
    }
}

exports.sync = () => run()
