// The github package carries out queries to various github types, transforms
// the different github types into a simple, single structure and returns the
// items.

package gh

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/go-github/v41/github"
	"golang.org/x/oauth2"
)

// GitHubItem is a simple, unified structure we can use to represent issues,
// PRs and notifications containing only the information the rest of the
// program requires.
type GitHubItem struct {
	Title   string
	HTMLURL string
	APIURL  string
	// Repository is the full `mikerhodes/github-to-omnifocus` style identifier
	Repository string
	ID         int
}

func (item GitHubItem) String() string {
	return fmt.Sprintf("GitHubItem: [%s] %s (%s)", item.Key(), item.Title, item.HTMLURL)
}

// Key meets the Keyed interface used for creating delta operations in
// github2omnifocus. For the desired state, this is a unique key for
// the item derived from the GitHub data.
func (item GitHubItem) Key() string {
	return fmt.Sprintf("%s#%d", item.Repository, item.ID)
}

type GitHubGateway struct {
	ctx context.Context
	c   *github.Client
}

func NewGitHubGateway(ctx context.Context, accessToken, APIURL string) (GitHubGateway, error) {
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: accessToken},
	)
	tc := oauth2.NewClient(ctx, ts)

	// Passing APIURL as the uploadURL (2nd param) technically doesn't
	// work but we never upload so we're okay
	// list all repositories for the authenticated user
	client, err := github.NewEnterpriseClient(APIURL, APIURL, tc)
	if err != nil {
		return GitHubGateway{}, err
	}

	return GitHubGateway{
		ctx: ctx,
		c:   client,
	}, nil
}

// GetIssues downloads and returns the issues for the user authenticated
// to c, transformed to GitHubItems.
func (ghg *GitHubGateway) GetIssues() ([]GitHubItem, error) {

	opt := &github.IssueListOptions{
		ListOptions: github.ListOptions{PerPage: 30},
	}

	issues := []*github.Issue{}
	for {
		log.Printf("Getting issues page %d", opt.Page)
		results, resp, err := ghg.c.Issues.List(ghg.ctx, true, opt)
		issues = append(issues, results...)
		if err != nil {
			return nil, err
		}
		if resp.NextPage == 0 {
			break
		}
		opt.Page = resp.NextPage
	}

	items := []GitHubItem{}
	for _, issue := range issues {
		item := GitHubItem{
			Title:      strings.TrimSpace(issue.GetTitle()),
			HTMLURL:    issue.GetHTMLURL(),
			APIURL:     issue.GetURL(),
			Repository: issue.GetRepository().GetFullName(),
			ID:         issue.GetNumber(),
		}
		items = append(items, item)
	}

	return items, nil
}

func (ghg *GitHubGateway) GetPRs() ([]GitHubItem, error) {
	user, _, err := ghg.c.Users.Get(ghg.ctx, "")
	if err != nil {
		return nil, err
	}
	query := "type:pr state:open review-requested:" + user.GetLogin()

	issues := []*github.Issue{}
	opt := &github.SearchOptions{
		ListOptions: github.ListOptions{PerPage: 30},
	}
	for {
		log.Printf("Getting PRs page %d", opt.Page)
		results, resp, err := ghg.c.Search.Issues(ghg.ctx, query, opt)
		if err != nil {
			return nil, err
		}
		issues = append(issues, results.Issues...)
		if resp.NextPage == 0 {
			break
		}
		opt.Page = resp.NextPage
	}

	items := []GitHubItem{}
	for _, issue := range issues {
		item := GitHubItem{
			Title:      strings.TrimSpace(issue.GetTitle()),
			HTMLURL:    issue.GetHTMLURL(),
			APIURL:     issue.GetURL(),
			Repository: issue.GetRepository().GetFullName(),
			ID:         issue.GetNumber(),
		}
		items = append(items, item)
	}
	return items, nil
}

func (ghg *GitHubGateway) GetNotifications() ([]GitHubItem, error) {

	// TODO Comment URLs

	// Retrieve
	opt := &github.NotificationListOptions{
		ListOptions: github.ListOptions{PerPage: 30},
	}
	notifications := []*github.Notification{}
	for {
		log.Printf("Getting Notifications page %d", opt.Page)
		results, resp, err := ghg.c.Activity.ListNotifications(ghg.ctx, opt)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, results...)
		if resp.NextPage == 0 {
			break
		}
		opt.Page = resp.NextPage
	}

	// Transform
	items := []GitHubItem{}
	for _, notification := range notifications {

		// notification.Subject.GetURL() is ${baseUrl}/repos/cloudant/infra/issues/1500
		parts := strings.Split(notification.Subject.GetURL(), "/")
		issueNumber, err := strconv.Atoi(parts[len(parts)-1])
		if err != nil {
			return nil, err
		}
		repo := parts[len(parts)-3]
		owner := parts[len(parts)-4]

		// Some notifications come with an API link to a comment, via
		// notification.Subject.GetLatestCommentURL(). This can either point to
		// a comment (${baseUrl}/repos/cloudant/infra/issues/comments/20486062)
		// or I've also seen just the issue (shrug!) API URL for issues that are
		// closed. In case GetLatestCommentURL() is blank, we fall back to
		// notification.Subject.GetURL().
		//
		// Annoyingly, the notification only comes with the API URLs for both
		// the comment and issue. This means that we have to retrive the item
		// using a second network request to grab its HTML URL (we could build
		// it from the API URL but that feels fragile).
		//
		// Later, we can optimise this to only retrieve for new items, but for
		// now we'll leave as-is. Broadly speaking, we'd need to capture the
		// ctx/client in a closure and use that to later get the HTMLURL.
		//
		// As we could be receiving a comment or an issue, and we only care
		// about the common-to-both html_url field, we just deserialise into a
		// struct that contains only that field. That means we can avoid a
		// larger if statement just to use the "right" type for the result, and
		// also not worry whether GetLatestCommentURL() gave us a comment or
		// issue API URL.
		type HTMLURLThing struct {
			HTMLURL string `json:"html_url,omitempty"`
		}
		var req *http.Request
		if notification.Subject.GetLatestCommentURL() != "" {
			req, err = ghg.c.NewRequest("GET", notification.Subject.GetLatestCommentURL(), nil)
		} else {
			req, err = ghg.c.NewRequest("GET", notification.Subject.GetURL(), nil)
		}
		if err != nil {
			return nil, fmt.Errorf("error creating request for notification's issue or comment: %v", err)
		}
		var issueOrComment HTMLURLThing
		_, err = ghg.c.Do(ghg.ctx, req, &issueOrComment)
		if err != nil {
			return nil, fmt.Errorf("error retrieving notification's issue or comment: %v", err)
		}
		htmlURL := issueOrComment.HTMLURL

		item := GitHubItem{
			Title:      strings.TrimSpace(notification.Subject.GetTitle()),
			HTMLURL:    htmlURL,
			APIURL:     notification.Subject.GetURL(),
			Repository: owner + "/" + repo,
			ID:         issueNumber,
		}
		items = append(items, item)
	}

	return items, nil
}
