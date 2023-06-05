v2.4
    - Fix https://github.com/mikerhodes/github-to-omnifocus/issues/10
v2.3
    - Support notifications for pull requests.
v2.2
    - Correct golangci-lint issues.
v2.1
    - Correctly process notifications about commits rather than giving up.
v2.0
    - Rewrite in Go.
1.8.0 2021-01-20
    - #2 Paginate queries to retrieve all items.
1.7.0 2020-07-31
    - Add due dates to notifications and reviews.
1.6.4 2020-06-11
    - Fix a bug when attempting to retrieve a comment for a notification
        received a 404 from GitHub and we failed to continue processing later
        notifications. Fallback to getting issue itself.
1.6.3 2020-05-29
    - Fix a bug when receiving notifications for closed issues.
1.6.2 2020-05-28
    - Refactor notifications code to be simpler.
1.6.1 2020-05-28
    - Fix exception when notification does not have a latest comment field
1.6.0 2020-05-27
    - Add direct link to latest comment to notifications.
1.3.1 2020-04-24
    - Fix a bug where PRs were assumed to be in an internal GitHub instance.
1.3.0 2020-04-20
    - Fix #4, add new tasks to top of projects.
1.1.1 2020-04-19
    - Fixed hard-coded org name in PR search. :facepalm:
