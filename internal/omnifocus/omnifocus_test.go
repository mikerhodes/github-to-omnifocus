package omnifocus

import "testing"

func TestTaskKey(t *testing.T) {
	task := Task{
		ID:   "foo",
		Name: "nate-double-u/github-to-omnifocus#3 foo bar foo",
	}
	k := task.Key()
	if k != "nate-double-u/github-to-omnifocus#3" {
		t.Fatalf("Didn't get expected key, got: %s", k)
	}
}
