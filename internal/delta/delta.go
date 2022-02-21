// Package delta provides functions to create "deltas" between two sets, which
// consist of add and remove operations to make a second set contain the same
// items as the first set.
//
// Within github2omnifocus, this is used to create the operations that bring the
// task list state in the local tool, Omnifocus, into line with the desired
// state from GitHub.
package delta

import (
	"fmt"
)

// OperationType states whether a DeltaOperation is add or remove.
type OperationType int

const (
	Add OperationType = iota + 1
	Remove
)

func (op OperationType) String() string {
	ops := [...]string{"add", "remove"}
	if op < Add || op > Remove {
		return fmt.Sprintf("DeltaOperation(%d)", int(op))
	}
	return ops[op-1]
}

// Keyed provides the Key function which is used by the Delta function to
// identify items uniquely.
type Keyed interface {
	Key() string
}

// A Operation states that Item should be added or removed from a set.
type Operation struct {
	Item Keyed
	Type OperationType
}

// Delta returns a slice of DeltaOperations that, when applied to current,
// will result in current containing the same items as desired.
func Delta(desired, current map[Keyed]struct{}) []Operation {
	ops := []Operation{}

	// Flipping to use the Key() as the map's hashkey allows for quicker lookup.
	// Without doing this, we are forced to essentially do the comparison as
	// a list comparison, looping over one list with an internal loop over the
	// other list, calling Key() all the time. For notifications in particular,
	// this can become large quickly: even a 50 item list ends up being in worst
	// case 2 * 50^2 = 5000 comparisons and Key() calls.
	desired2 := map[string]Keyed{}
	for k := range desired {
		desired2[k.Key()] = k
		// log.Printf("Desired: %s", k.Key())
	}
	current2 := map[string]Keyed{}
	for k := range current {
		current2[k.Key()] = k
		// log.Printf("Current: %s", k.Key())
	}

	// If it's in desired, and not in current: add it.
	for k, v := range desired2 {
		if _, ok := current2[k]; !ok {
			ops = append(ops, Operation{
				Type: Add,
				Item: v,
			})
		}
	}

	// If it's in current, and not in desired: remove it.
	for k, v := range current2 {
		if _, ok := desired2[k]; !ok {
			ops = append(ops, Operation{
				Type: Remove,
				Item: v,
			})
		}
	}

	return ops
}
