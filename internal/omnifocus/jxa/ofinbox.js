// A JS script to load up Omnifocus inbox tasks
// Run it using:
// 	osascript -l JavaScript ofinbox.js | jq .

function inbox() {
	var of = Application("OmniFocus")
	of.includeStandardAdditions = true;
	return of.defaultDocument
		.inboxTasks()
		.filter((task) => task.completed() === false)
		.map((task) => {
			return { "id": task.id(), "name": task.name() };
		});
}

ObjC.import('stdlib')
JSON.stringify(inbox())
