package internal

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
)

type Config struct {
	// API URL for GitHub
	APIURL string
	// Personal Access token
	AccessToken string
	// OF Tag applied to every task managed by the app (so we never mess with other tasks)
	AppTag string
	// OF Project that assigned issues are added to
	AssignedProject string
	// OF Tag for assigned items
	AssignedTag string
	// OF Project for PRs for review
	ReviewProject string
	// OF Tag for review items
	ReviewTag string
	// OF Project for notifications
	NotificationsProject string
	// OF Tag for notifications
	NotificationTag string
	// True if due date of today should be set on notifications
	SetNotificationsDueDate bool
}

// LoadConfig loads JSON config from ~/.config/github2omnifocus/config.json
func LoadConfig() (Config, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return Config{}, fmt.Errorf("could not find home dir: %v", err)
	}
	configPath := path.Join(home, ".config", "github2omnifocus", "config.json")

	var bytes []byte
	bytes, err = ioutil.ReadFile(configPath)
	if err != nil {
		return Config{}, fmt.Errorf("expected config.json at %s: %v", configPath, err)
	}

	c := Config{
		APIURL:                  "https://api.github.com",
		AppTag:                  "github",
		AssignedProject:         "GitHub Assigned",
		AssignedTag:             "assigned",
		ReviewProject:           "GitHub Reviews",
		ReviewTag:               "review",
		NotificationsProject:    "GitHub Notifications",
		NotificationTag:         "notification",
		SetNotificationsDueDate: true,
	}
	err = json.Unmarshal(bytes, &c)
	if err != nil {
		return Config{}, fmt.Errorf("error unmarshalling config JSON from %s: %v", configPath, err)
	}

	log.Printf("Config loaded from %s:", configPath)
	log.Printf("  GitHub API server: %s", c.APIURL)
	if c.AccessToken != "" {
		log.Printf("  GitHub token: *****")
	} else {
		log.Printf("  GitHub token: <none, likely error!>")
	}
	log.Printf("  Omnifocus tag: %s", c.AppTag)
	log.Printf("  Omnifocus assigned issue project: %s", c.AssignedProject)
	log.Printf("  Omnifocus PR to review project: %s", c.ReviewProject)
	log.Printf("  Omnifocus notifications project: %s", c.NotificationsProject)

	return c, nil
}
