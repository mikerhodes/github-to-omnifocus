# Add your GitHub Issues and PRs to Omnifocus

A node.js application that adds Omnifocus tasks for:

- GitHub Issues assigned to you.
- GitHub PRs where your review has been requested.

If an issue or PR is closed or not assigned to you any more, it will be marked
complete within Omnifocus.

## Supported versions of Omnifocus

- Tested with **Omnifocus 3.6.3**.
- Requires Professional edition for automation support.

## How tasks are associated with GitHub resources

Tasks are created using the form:

```
myorg/myrepo#123 My issue title
```

The `myorg/myrepo#123` is the key that links tasks to their issues/PRs.

## Using `github-to-omnifocus`

### Set up Omnifocus

By default, `github-to-omnifocus` will put Issues assigned to you in the
`GitHub Issues` project. It will put PRs in the `GitHub PRs` project. It will
also apply the `github` tag.

1. Create `GitHub Issues` project in Omnifocus. This can be nested within
    folders.
1. Create `GitHub PRs` project in Omnifocus. This can be nested within
    folders.

**‼️ Warning ‼️**: Currently, these projects **must** be uniquely owned by
`github-to-omnifocus`, as it will mark any unrecognised tasks as completed
within the projects!

Note: if you set up different project names in `github-to-omnifocus.toml`,
ensure that those are the projects that are created :smile:.

It is a TODO to allow `github-to-omnifocus` to live alongside normal tasks
within a generic project -- something along the lines of using
`github-to-omnifocus` as a tag.

### Set up github-to-omnifocus.toml

Create `~/.github-to-omnifocus.toml`. This must contain a value for `auth_token`
file in the `[github]` table:

```toml
[github]
auth_token = "myauthtoken"  # App will fail to launch if this isn't set
```

Auth token can be generated at https://github.com/settings/tokens. They should
have `notifications`, `repo` and `user` scope. Strictly `notifications` is
not required, but it's a feature I'd like to add.

### Run github-to-omnifocus

Run using:

```
npx @mikerhodes/github-to-omnifocus sync
```

## Other configuration values

There are several other options that can be set in this file. The following
values are the defaults; you can leave out these values if they are correct for
your use-case. As mentioned, the only value that must be specified is
`auth_token`.

```toml
[github]
api_url = "https://api.github.com"  # Change when using GitHub Enterprise
auth_token = ""

[omnifocus]
tag = "github"
issue_project = "GitHub Issues"
pr_project = "GitHub PRs"
```

- Using the same project name for `issue_project` and `pr_project` isn't
    supported right now.
- The `api_url` for a GitHub Enterprise install will look something like
    `https://github.mycompany.com/api/v3`.
