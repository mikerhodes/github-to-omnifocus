package omnifocus

import (
	"encoding/json"
	"io"
	"log"
	"os"
	"os/exec"
)

// This file holds the wrapper functions for our JXA scripts

// OmnifocusTasksForQuery returns a list of tasks from Omnifocus that
// match the passed query.
func OmnifocusTasksForQuery(q TaskQuery) ([]OmnifocusTask, error) {
	jsCode, _ := jxa.ReadFile("jxa/oftasksforprojectwithtag.js")
	args, _ := json.Marshal(q)

	out, err := executeScript(jsCode, args)
	if err != nil {
		return []OmnifocusTask{}, err
	}

	tasks := []OmnifocusTask{}
	err = json.Unmarshal(out, &tasks)
	if err != nil {
		return []OmnifocusTask{}, err
	}

	return tasks, nil
}

// MarkOmnifocusTaskComplete marks a task as complete. t only requires the
// id field to be set.
func MarkOmnifocusTaskComplete(t OmnifocusTask) error {
	jsCode, _ := jxa.ReadFile("jxa/ofmarktaskcomplete.js")
	args, _ := json.Marshal(t)

	_, err := executeScript(jsCode, args)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}

// EnsureTagExists creates a tag in Omnifocus if it doesn't already exist.
func EnsureTagExists(tag OmnifocusTag) error {
	jsCode, _ := jxa.ReadFile("jxa/ofensuretagexists.js")
	args, _ := json.Marshal(tag)

	_, err := executeScript(jsCode, args)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}

// AddNewOmnifocusTask adds a new Omnifocus task
func AddNewOmnifocusTask(t NewOmnifocusTask) (OmnifocusTask, error) {
	jsCode, _ := jxa.ReadFile("jxa/ofaddnewtask.js")
	args, _ := json.Marshal(t)

	out, err := executeScript(jsCode, args)
	if err != nil {
		return OmnifocusTask{}, err
	}

	task := OmnifocusTask{}
	err = json.Unmarshal(out, &task)
	if err != nil {
		return OmnifocusTask{}, err
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
		io.WriteString(stdin, string(jsCode))
	}()

	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	return out, nil
}
