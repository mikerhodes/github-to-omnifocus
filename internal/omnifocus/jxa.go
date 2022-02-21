package omnifocus

import (
	"encoding/json"
	"io"
	"log"
	"os"
	"os/exec"
)

// This file holds the wrapper functions for our JXA scripts

// TasksForQuery returns a list of tasks from Omnifocus that
// match the passed query.
func TasksForQuery(q TaskQuery) ([]Task, error) {
	jsCode, _ := jxa.ReadFile("jxa/oftasksforprojectwithtag.js")
	args, _ := json.Marshal(q)

	out, err := executeScript(jsCode, args)
	if err != nil {
		return []Task{}, err
	}

	tasks := []Task{}
	err = json.Unmarshal(out, &tasks)
	if err != nil {
		return []Task{}, err
	}

	return tasks, nil
}

// MarkOmnifocusTaskComplete marks a task as complete. t only requires the
// id field to be set.
func MarkOmnifocusTaskComplete(t Task) error {
	jsCode, _ := jxa.ReadFile("jxa/ofmarktaskcomplete.js")
	args, _ := json.Marshal(t)

	_, err := executeScript(jsCode, args)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}

// EnsureTagExists creates a tag in Omnifocus if it doesn't already exist.
func EnsureTagExists(tag Tag) error {
	jsCode, _ := jxa.ReadFile("jxa/ofensuretagexists.js")
	args, _ := json.Marshal(tag)

	_, err := executeScript(jsCode, args)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}

// AddNewOmnifocusTask adds a new Omnifocus task
func AddNewOmnifocusTask(t NewOmnifocusTask) (Task, error) {
	jsCode, _ := jxa.ReadFile("jxa/ofaddnewtask.js")
	args, _ := json.Marshal(t)

	out, err := executeScript(jsCode, args)
	if err != nil {
		return Task{}, err
	}

	task := Task{}
	err = json.Unmarshal(out, &task)
	if err != nil {
		return Task{}, err
	}

	return task, nil
}

// executeScript runs jsCode passing it args as input, and returns the
// output of the command.
func executeScript(jsCode []byte, args []byte) ([]byte, error) {
	// All scripts expect a JSON object passed in via the
	// OSA_ARGS environment variable. The script itself is
	// passed into osascript via stdin. The script outputs
	// a JSON document over stdout.

	cmd := exec.Command("/usr/bin/osascript", "-l", "JavaScript")

	cmd.Env = append(os.Environ(),
		"OSA_ARGS="+string(args),
	)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	go func() {
		defer stdin.Close()
		_, err := io.WriteString(stdin, string(jsCode))
		if err != nil {
			// should never fail
			log.Fatal(err)
		}
	}()

	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	return out, nil
}
