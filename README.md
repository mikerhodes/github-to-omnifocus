# Add GitHub Issues to Omnifocus

A script to add GitHub issues that are assigned to you to your
Omnifocus task list.

## Using

Create `~/.github-to-omnifocus.toml`. This must contain a value for `auth_token`
file in the `[github]` table.

The following values are the defaults; you can leave out these values if they
are correct for your use-case. As mentioned, the only value that must be
specified is `auth_token`.

```toml
[github]
api_url = "https://api.github.com"
auth_token = ""  # App will fail to launch if this isn't set

[omnifocus]
tag = "github"
issue_project = "GitHub Issues"
pr_project = "GitHub PRs"
```

- Auth token can be generated at https://github.com/settings/tokens. They
    should have `notifications`, `repo` and `user` scope. Strictly
    `notifications` is not required, but it's a feature I'd like to add.
- Using the same project name for `issue_project` and `pr_project` isn't supported
  right now.
- The `api_url` for a GitHub Enterprise install will look something like
  `https://github.mycompany.com/api/v3`.

## Developing

- [Add the Omnifocus application to your Script Editor
    library][omlib]
    by opening Script Editor, Window -> Library, the "+" button and then
    selecting OmniFocus.
    - Make sure to switch to JavaScript view.
- [osa2] is used to open functions with OSA. It provides a bridge to and from
    the function executed in the OSA environment.

[omlib]: https://support.apple.com/en-ie/guide/script-editor/scpedt11560/2.11/mac/10.15
[osa2]: https://github.com/wtfaremyinitials/osa2

### Useful links

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
- JS
    - Array functional methods <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach>
    - <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types>
- OF Taskpaper
    - <https://support.omnigroup.com/omnifocus-taskpaper-reference/>
- OF JS examples
    - <https://github.com/nickrobinson/omnifocus/blob/master/index.js>
    - <https://github.com/linclark/omnifocus-github/blob/master/cli.js>
- Launchd
    - Running a job periodically section at <https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html>
    - User's agents live at `~/Library/LaunchAgents`
    - https://www.launchd.info/
