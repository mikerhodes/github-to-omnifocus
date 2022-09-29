package omnifocus

import (
	"embed"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/nate-double-u/github-to-omnifocus/internal/gh"
)

var (
	//go:embed jxa
	jxa embed.FS
)

// Task represents a task existing in Omnifocus
type Task struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (t Task) String() string {
	return fmt.Sprintf("OmnifocusTask: [%s] %s", t.Key(), t.Name)
}

// Key meets the Keyed interface used for creating delta operations in
// github2omnifocus.
func (t Task) Key() string {
	// The "key" here is the one used in github2omnifocus rather than the
	// Id used within Omnifocus. It's an opaque string we receive when creating
	// the task along with the task's actual title, though we can assume
	// it doesn't contain spaces. We stick it as the first thing in the task's
	// Name when we create the tasks.
	return strings.SplitN(t.Name, " ", 2)[0] //nolint:gomnd
}

// TaskQuery defines a query to find Omnifocus tasks
type TaskQuery struct {
	ProjectName string   `json:"projectName"`
	Tags        []string `json:"tags"`
}

// NewOmnifocusTask defines a request to create a new task
type NewOmnifocusTask struct {
	ProjectName string   `json:"projectName"`
	Name        string   `json:"name"`
	Tags        []string `json:"tags"`
	Note        string   `json:"note"`
	DueDateMS   int64    `json:"dueDateMS"`
}

// Tag represents an Omnifocus tag
type Tag struct {
	Name string `json:"name"`
}

type Gateway struct {
	AppTag                  string
	AssignedTag             string
	AssignedProject         string
	ReviewTag               string
	ReviewProject           string
	NotificationTag         string
	NotificationsProject    string
	SetNotificationsDueDate bool
	DueDate                 time.Time
}

func (og *Gateway) GetIssues() ([]Task, error) {
	tasks, err := TasksForQuery(TaskQuery{
		ProjectName: og.AssignedProject,
		Tags:        []string{og.AppTag, og.AssignedTag},
	})
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (og *Gateway) GetPRs() ([]Task, error) {
	tasks, err := TasksForQuery(TaskQuery{
		ProjectName: og.ReviewProject,
		Tags:        []string{og.AppTag, og.ReviewTag},
	})
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (og *Gateway) GetNotifications() ([]Task, error) {
	tasks, err := TasksForQuery(TaskQuery{
		ProjectName: og.NotificationsProject,
		Tags:        []string{og.AppTag, og.NotificationTag},
	})
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (og *Gateway) AddIssue(t gh.GitHubItem) error {
	log.Printf("AddIssue: %s", t)
	_, err := AddNewOmnifocusTask(NewOmnifocusTask{
		ProjectName: og.AssignedProject,
		Name:        t.Key() + " " + t.Title,
		Tags:        []string{og.AppTag, og.AssignedTag},
		Note:        t.HTMLURL,
	})
	if err != nil {
		return fmt.Errorf("error adding task: %v", err)
	}
	return nil
}

func (og *Gateway) AddPR(t gh.GitHubItem) error {
	log.Printf("AddPR: %s", t)
	_, err := AddNewOmnifocusTask(NewOmnifocusTask{
		ProjectName: og.ReviewProject,
		Name:        t.Key() + " " + t.Title,
		Tags:        []string{og.AppTag, og.ReviewTag},
		Note:        t.HTMLURL,
	})
	if err != nil {
		return fmt.Errorf("error adding task: %v", err)
	}
	return nil
}

func (og *Gateway) AddNotification(t gh.GitHubItem) error {
	log.Printf("AddNotification: %s", t)
	newT := NewOmnifocusTask{
		ProjectName: og.NotificationsProject,
		Name:        t.Key() + " " + t.Title,
		Tags:        []string{og.AppTag, og.NotificationTag},
		Note:        t.HTMLURL,
	}
	if og.SetNotificationsDueDate {
		newT.DueDateMS = og.DueDate.UnixMilli()
	}
	_, err := AddNewOmnifocusTask(newT)
	if err != nil {
		return fmt.Errorf("error adding task: %v", err)
	}
	return nil
}

func (og *Gateway) CompleteIssue(t Task) error {
	log.Printf("CompleteIssue: %s", t)
	err := MarkOmnifocusTaskComplete(t)
	if err != nil {
		return fmt.Errorf("error completing task: %v", err)
	}
	return nil
}

func (og *Gateway) CompletePR(t Task) error {
	log.Printf("CompletePR: %s", t)
	err := MarkOmnifocusTaskComplete(t)
	if err != nil {
		return fmt.Errorf("error completing task: %v", err)
	}
	return nil
}

func (og *Gateway) CompleteNotification(t Task) error {
	log.Printf("CompleteNotification: %s", t)
	err := MarkOmnifocusTaskComplete(t)
	if err != nil {
		return fmt.Errorf("error completing task: %v", err)
	}
	return nil
}
