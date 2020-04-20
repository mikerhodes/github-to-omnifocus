# Add your GitHub Issues and PRs to Omnifocus

A node.js application that adds Omnifocus tasks for:

- GitHub Issues assigned to you.
- GitHub PRs where your review has been requested.

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

By default, `github-to-omnifocus` will put Issues assigned to you in the
`GitHub Issues` project. It will put PRs in the `GitHub PRs` project. It will
also apply the `github` tag and a "type" tag to indicate whether
the task is an issue or PR. The projects are not auto-created and must exist:

1. Create `GitHub Issues` project in Omnifocus. This can be nested within
    folders.
1. Create `GitHub PRs` project in Omnifocus. This can be nested within
    folders.

Note: if you set up different project names in `github-to-omnifocus.toml`,
ensure that you create projects with those names.

### Create GitHub personal developer token

- Open https://github.com/settings/tokens (or the equivalent on your GitHub
    Enterprise instance).
- Generate a new token with the following scopes:
    - `repo`
    - `user`
    - `notifications` - optional, I haven't written a notifications feature yet,
        but I'd like to.

### Set up application configuration (.github-to-omnifocus.toml)

Create `~/.github-to-omnifocus.toml`. This must contain a value for the
`auth_token` field in the `[github]` table, which is used for API calls to
GitHub. See below for how to configure `github-to-omnifocus` to use a GitHub
Enterprise server.

```toml
[github]
auth_token = "myauthtoken"  # App will fail to launch if this isn't set
```

### Run github-to-omnifocus using npx

Run using:

```
npx @mikerhodes/github-to-omnifocus sync
```

`npx` is included with `npm` so you probably have it installed. It will run
the application _without_ leaving any installed files on your system.

## Other configuration values

There are several other options that can be set in
`~/.github-to-omnifocus.toml`. The following values are the defaults; you can
leave out these values if they are correct for your use-case. As mentioned, the
only value that must be specified is `auth_token`.

```toml
[github]
api_url = "https://api.github.com"  # Change when using GitHub Enterprise
auth_token = ""

[omnifocus]
app_tag = "github"                  # Used by app to find its own tasks
issue_project = "GitHub Issues"
pr_project = "GitHub PRs"
```

- If you use `github` as a tag in other contexts, you may want to change
    the `app_tag` value. Strictly, this is only required if other tasks
    with the `github` tag will be found within the projects that
    `github-to-omnifocus` are using -- both project and tag are considered
    for whether `github-to-omnifocus` "owns" a task and so may modify it.
- The `issue_project` and `pr_project` can be the same project and can also
    be used for other tasks -- `github-to-omnifocus` uses the `app_tag` and
    two internal tags to find the tasks it "owns" and which type they are.
- The `api_url` for a GitHub Enterprise install will look something like
    `https://github.mycompany.com/api/v3`.

## Known Issues

See the [Issues](https://github.com/mikerhodes/github-to-omnifocus/issues) in
this repository.
