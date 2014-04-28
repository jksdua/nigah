Nigah
=====

__Watchful eye for event emitters__

Ever wanted to test whether the correct events are being emitted? This utility provides an easy and robust way of testing all your event emitters.

It does not mock or stub event listeners, instead it overrides the emit method to stash important data required for assertions and then lets the program execution continue as is.


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

### watcher.restore()

Restores the event emitter to its original state


Changelog
---------

__v0.0.2__
- Added repo details to package.json

__v0.0.1__
- Initial commit