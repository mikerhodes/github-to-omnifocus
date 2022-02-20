package omnifocus

import "testing"

func TestTaskKey(t *testing.T) {
	task := OmnifocusTask{
		Id:   "foo",
		Name: "mikerhodes/github-to-omnifocus#3 foo bar foo",
	}
	k := task.Key()
	if k != "mikerhodes/github-to-omnifocus#3" {
		t.Fatalf("Didn't get expected key, got: %s", k)
	}
}
