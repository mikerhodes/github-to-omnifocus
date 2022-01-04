# Developing

github2omnifocus is a tool to bring a set of Omnifocus tasks into line with the
user's issues, awaiting PR reviews and notifications in Github.

The application can be viewed as a reconciliation loop between a _current_ and
_desired_ state:

- The _current_ state is the set of tasks in Omnifocus managed by
    github2omnifocus. These are read using JXA (Javascript automation) from
    Omnifocus.
- The _desired_ state is the currently open issues assigned to the user, the PRs
    they've been requested to review and their notifications.

Once the current and desired states have been retrieved from Omnifocus and
Github, the application calculates the operations to bring Omnifocus into
the desired state via task creation and completion, then carries those
operations out.

## JXA

JXA is a Javascript automation framework for macOS applications that leans
heavily on their Applescript automation features. It was heralded as the
future of automation on macOS, but has been somewhat neglected since so far
as I can tell. I find it easier to write than Applescript, and have pieced
together the scripts that are used by this application mostly from samples in
the Omnifocus forums. They work, which feels about the best that can be said for
them.

## Notes

This is basically a set of reminders to me for when developing this app.

- [Add the Omnifocus application to your Script Editor
    library][omlib]
    by opening Script Editor, Window -> Library, the "+" button and then
    selecting OmniFocus.
    - Make sure to switch to JavaScript view.
- [osa2] is used to open functions with OSA. It provides a bridge to and from
    the function executed in the OSA environment.

[omlib]: https://support.apple.com/en-ie/guide/script-editor/scpedt11560/2.11/mac/10.15
[osa2]: https://github.com/wtfaremyinitials/osa2

## Useful links

- <https://inside.omnifocus.com/applescript>
- Sort of useful <https://www.omni-automation.com/omnifocus/OF-API.html#Document>
- <https://discourse.omnigroup.com/search?q=javascript%20category%3A6>
    - <https://discourse.omnigroup.com/t/add-a-new-task-and-set-the-project-it-belongs-to-via-javascript-of3/44111/3>
    - <https://discourse.omnigroup.com/t/omnifocus-javascript-osa-library-feedback/45260/2>
    - <https://discourse.omnigroup.com/t/of3-re-writing-tag-order-in-javascript-macos/44362>
    - <https://discourse.omnigroup.com/t/automatically-flag-tasks-in-specific-projects-contexts-according-to-due-defer-date/32093/28>
    - Lots of example code <https://discourse.omnigroup.com/t/re-jxa-when-to-use-app-add-app-remove-vs-array-variable-push/49305/14>
    - Simple create new task <https://discourse.omnigroup.com/t/creating-a-new-task-with-javascript-for-automation-jxa/22393>
- JS Automation
    - <https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-10.html#//apple_ref/doc/uid/TP40014508-CH109-SW14>
    - <https://hackmag.com/coding/getting-to-grips-with-javascript-automation-for-os-x/>
- OF Taskpaper
    - <https://support.omnigroup.com/omnifocus-taskpaper-reference/>
- OF JS examples
    - <https://github.com/nickrobinson/omnifocus/blob/master/index.js>
    - <https://github.com/linclark/omnifocus-github/blob/master/cli.js>
- Launchd
    - Running a job periodically section at <https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html>
    - User's agents live at `~/Library/LaunchAgents`
    - https://www.launchd.info/
