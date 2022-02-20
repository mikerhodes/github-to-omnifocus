# Add your GitHub Issues and PRs to Omnifocus

A Go application that adds Omnifocus tasks for:

- GitHub Issues and PRs assigned to you.
- GitHub PRs where your review has been requested.
- Notifications you have received.

Notifications and Review Requests will gain a due date of today.

If an issue or PR is closed or not assigned to you any more, it will be marked
complete within Omnifocus.

The application will **not** close issues in GitHub which are marked as complete
in Omnifocus -- the GitHub server is considered source-of-truth for issue and
PR state. This feels safer and, thankfully, is easier to code for.

`github-to-omnifocus` supports both GitHub and GitHub Enterprise.

## Supported versions of Omnifocus

- Uses tags, so needs **Omnifocus 3.x**
- Uses Javascript automation, so needs the **Professional** edition.
- Tested with **Omnifocus 3.6.3**.

## How Omnifocus tasks are managed

`github-to-omnifocus` tries its best to live alongside your existing workflow. To
this end, while it defaults to using separate projects for Issues and PRs, it
supports using the same project for both, and it will avoid affecting tasks
that it didn't create itself, meaning it can share a project with other tasks.

To avoid affecting tasks that it doesn't "own", when `github-to-omnifocus`
creates tasks they are given the tag `github` (can be changed via
configuration). Further, they are given a "type tag" to differentiate whether
they are issues, PRs or whatever. Using tags in this manner allows
`github-to-omnifocus` to live alongside other tasks within the projects it is
using. `github-to-omnifocus` will only ever mark tasks complete that are in
the configured projects _and_ have the appropriate tags.

Within the tasks it owns, `github-to-omnifocus` associates a task with its
corresponding GitHub issue or PR using a prefix on each task:

```
myorg/myrepo#123 My issue title
---------------- --------------
  |                |
  `- Prefix        `- Issue or PR title
```

Hopefully it is clear how `myorg/myrepo#123` links tasks to their issues/PRs.

## Getting started

Now you know how `github-to-omnifocus` works and have figured whether it'll work
with your workflow, it's time to get started:

1. Set up Omnifocus projects.
1. Create a personal developer token on GitHub for `github-to-omnifocus` to use
    when making requests to GitHub's API.
1. Set up application configuration.
1. Run `github-to-omnifocus` via `npx` (included with `npm`), which will run
    the application _without_ leaving any installed files on your system.

### Set up Omnifocus projects

By default, the application uses the following projects, which must be created
manually:

- "GitHub Assigned"
- "GitHub Reviews"
- "GitHub Notifications"

These projects can be nested within folders. The names can be customised in the
configuration file.

### Create GitHub personal developer token

- Open https://github.com/settings/tokens (or the equivalent on your GitHub
    Enterprise instance).
- Generate a new token with the following scopes:
    - `repo`
    - `user`
    - `notifications`

### Set up application configuration (.github-to-omnifocus.toml)

Create `~/.config/github2omnifocus/config.json`. This must contain a value for
the `AccessToken` field, which is used for API calls to GitHub. See below for
how to configure `github2omnifocus` to use a GitHub Enterprise server.

```json
{
    "AccessToken": "my_personal_access_token"
}
```

#### GitHub Enterprise

Add an `APIURL` field to your configuration to get the application to connect
to GitHub Enterprise:

```json
{
    "APIURL": "https://github.mycompany.com/api/v3",
    "AccessToken": "my_personal_access_token"
}
```

### Run github-to-omnifocus

Ensure Omnifocus is open. Then run using:

```
make run
```

## Other configuration values

There are several other options that can be set in
`~/.config/github2omnifocus/config.json`. The following values are the
defaults; you can leave out these values if they are correct for your use-case.
As mentioned, the only value that must be specified is `AccessToken`.

```json
{
    "APIURL": "https://api.github.com",
    "AccessToken": "",
    "AppTag": "github",
    "AssignedProject": "GitHub Assigned",
    "ReviewProject": "GitHub Reviews",
    "NotificationsProject": "GitHub Notifications",
}
```

- Change `APIURL` when using GitHub Enterprise, `https://github.mycompany.com/api/v3`.
- `AppTag` is used by the application to identify tasks that it owns, and so can
    update, complete and so on. It should not be used otherwise.
- The `*Project` configurations are used to alter the project used for tasks
    for each type of task that the application creates. The project need not
    be unique for each type of task, and it isn't necessary to give the
    app its "own" projects as it uses tags to identify its own tasks.

## Known Issues

See the [Issues](https://github.com/mikerhodes/github-to-omnifocus/issues) in
this repository.
