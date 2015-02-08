Nigah
=====

__Watchful eye for event emitters__

Ever wanted to test whether the correct events are being emitted? This utility provides an easy and robust way of testing all your event emitters.

It does not mock or stub event listeners, instead it overrides the emit method to stash important data required for assertions and then lets the program execution continue as is.

__New:__ Watchers and emitters are synced. Watcher is now an [eventemitter2](https://www.npmjs.com/package/eventemitter2) instance. Events trigger on one also triggers them on the other.


Installation
------------

	# only needed in non production environment
	npm install nigah --save-dev


Usage
-----

```js
//test.js

var nigah = require('nigah');
var events = require('events');
var assert = require('assert');
var emitter = new events.EventEmitter();

var watcher;

beforeEach(function() {
	// create a new watcher
	watcher = nigah(emitter);
});

afterEach(function() {
	// restore emitter to its original state
	watcher.restore();
});

it('should pass the correct id', function(done) {
	emitter.on('done', function() {
		// non strict mode
		watcher.assertCount({
			'super awesome event': 2,
			done: 1
		});

		// strict mode - add strict boolean
		watcher.assertCount({
			'super awesome event': 2,
			'another event': 1,
			done: 1
		}, true);

		// check arguments match
		var history = watcher.getHistory('super awesome event');
		assert.eql(history[0], [1, 2]);
		// should throw since someObject.id below does not exist
		assert.eql(history[1], [3, 4]);

		done();
	});

	emitter.emit('super awesome event', 1, 2);
	emitter.emit('super awesome event', someObject.id, 4);
	emitter.emit('another event', 99);
	emitter.emit('done');
});
```

API
---

A watcher has the following methods:

### watcher.assertCount(expectedCounts, strict)

Assert count provides an easy way to assert that the required events were transmitted x number of times as expected.

#### expectedCounts

An object with events denoted as keys and their expected count denoted as their respective values. An example of expectedCounts is shown below:

```js
{
	// positive assertions
	ready: 1,
	'database.initialised': 1,
	'fixture.added': 3,

	// negative assertion
	'catastrophic error': 0
}
```

#### strict

A boolean flag to enable strict mode. Under strict mode, only events within the expectedCounts are allowed. Any other events emitted are considered to be an error. This is especially useful in scenarios where you are expecting your code to short-circuit if a pre-condition fails, but you accidentally forget the return statement allowing the code to execute.


### watcher.getHistory(event)

Returns all the arguments that were emitted. Useful for asserting correct arguments are passed.

This function returns an array containing an array of arguments emitted for each event.

```js
var nigah = require('nigah');
var events = require('events');
var assert = require('assert');
var emitter = new events.EventEmitter();

var watcher;

beforeEach(function() {
	watcher = nigah(emitter);
});

afterEach(function() {
	watcher.restore();
});

it('should pass the correct id', function(done) {
	emitter.on('super awesome event', function(id) {
		var args = watcher.getHistory('super awesome event')[0];
		assert.equal(args[0], 1);
	});

	emitter.emit('super awesome event', 1);
});
```

### watcher.resetHistory()

Resets history of a watcher

### watcher.restore()

Restores the event emitter to its original state

### watcher.emit() and watcher.on()

Watchers and emitters are now synced. Emitting an event on one also triggers it on the other.

```js
var watcher = nigah(emitter, { wildcard: true, delimiter: '.' });

// listen for events on the watcher
watcher.once('some event', function() {
	... do something ...
});


// emit on the watcher, it is emitted on the original emitter
	// good for triggering event based processing
emitter.once('some event', function() {

	// if it was emitted on the original emitter, it should also be caught by the watcher right?
	watcher.assertCount({
		'some event': 1
	});

});
watcher.emit('some event');
```



Changelog
---------

__v1.0.0 (8 Feb 2014)__
- Watchers are now event emitters and events flow two-way between the emitter and the watcher
- Added a `resetHistory()` method on the watcher
- Ready for release so why not make it 1.0.0!

__v0.0.2__
- Added repo details to package.json

__v0.0.1__
- Initial commit