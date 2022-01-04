package delta

import (
	"sort"
	"testing"
)

type MockKeyed struct {
	key string
}

func (mk *MockKeyed) Key() string {
	return mk.key
}

func TestDelta1NoChange(t *testing.T) {
	current := map[Keyed]struct{}{
		&MockKeyed{key: "foo"}: {},
		&MockKeyed{key: "bar"}: {},
	}
	desired := map[Keyed]struct{}{
		&MockKeyed{key: "foo"}: {},
		&MockKeyed{key: "bar"}: {},
	}
	ops := Delta(desired, current)
	if len(ops) != 0 {
		t.Fatal("Did not receive empty operations slice")
	}
}

func TestDelta2AddItem(t *testing.T) {
	current := map[Keyed]struct{}{
		&MockKeyed{key: "bar"}: {},
	}
	desired := map[Keyed]struct{}{
		&MockKeyed{key: "foo"}: {},
		&MockKeyed{key: "bar"}: {},
	}
	ops := Delta(desired, current)
	if len(ops) != 1 {
		t.Fatal("Expected 1 add operation")
	}
	if ops[0].Type != Add {
		t.Fatal("Expected 1 add operation")
	}
	if ops[0].Item.Key() != "foo" {
		t.Fatal("Expected 1 add operation")
	}
}

func TestDelta3RemoveItem(t *testing.T) {
	current := map[Keyed]struct{}{
		&MockKeyed{key: "foo"}: {},
		&MockKeyed{key: "bar"}: {},
	}
	desired := map[Keyed]struct{}{
		&MockKeyed{key: "foo"}: {},
	}
	ops := Delta(desired, current)
	if len(ops) != 1 {
		t.Fatal("Expected 1 remove operation")
	}
	if ops[0].Type != Remove {
		t.Fatal("Expected 1 remove operation")
	}
	if ops[0].Item.Key() != "bar" {
		t.Fatal("Expected 1 remove operation")
	}
}

func TestDelta4AllChange(t *testing.T) {
	current := map[Keyed]struct{}{
		&MockKeyed{key: "baz"}:  {},
		&MockKeyed{key: "quux"}: {},
	}
	desired := map[Keyed]struct{}{
		&MockKeyed{key: "foo"}: {},
		&MockKeyed{key: "bar"}: {},
	}
	ops := Delta(desired, current)
	if len(ops) != 4 {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}

	sort.SliceStable(ops, func(i, j int) bool {
		return ops[i].Item.Key() < ops[j].Item.Key()
	})

	if ops[0].Type != Add {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}
	if ops[0].Item.Key() != "bar" {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}

	if ops[1].Type != Remove {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}
	if ops[1].Item.Key() != "baz" {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}

	if ops[2].Type != Add {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}
	if ops[2].Item.Key() != "foo" {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}

	if ops[3].Type != Remove {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}
	if ops[3].Item.Key() != "quux" {
		t.Fatal("Expected 4 operations, 2 add, 2 remove")
	}
}

func TestDeltaNoItems(t *testing.T) {
	current := map[Keyed]struct{}{}
	desired := map[Keyed]struct{}{}
	ops := Delta(desired, current)
	if len(ops) != 0 {
		t.Fatal("Did not receive empty operations slice")
	}
}
