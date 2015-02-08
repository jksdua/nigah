/* jshint node:true */
'use strict';

var assert = require('assert');
var extend = require('extend');
var EventEmitter = require('eventemitter2').EventEmitter2;

var slice = Array.prototype.slice;

/**
	Overrides the emit method of an event emitter to assist with event assertions

	@param {EventEmitter} emitter Emitter to be overridden
	@param {options} options Options
 */
function Watcher(emitter, options) {
	if (!(this instanceof Watcher)) {
		return new Watcher(emitter);
	}

	this.emitter = emitter;
	this.options = extend({ wildcard: true, delimiter: '.' }, options);
	this.resetHistory();

	// light assertion that emitter is a valid EventEmitter object
	assert(emitter.on, 'Emitter does not contain an on method');
	assert(emitter.once, 'Emitter does not contain a once method');
	assert(emitter.emit, 'Emitter does not contain an emit method');

	// override emit method
	this.originalEmit = emitter.emit;
	emitter.emit = this.fakeEmitter.bind(this);

	EventEmitter.call(this,	this.options);
}

var proto = Watcher.prototype = Object.create(EventEmitter.prototype);

/**
	Restores the overridden emitter objects
 */
proto.restore = function() {
	this.emitter.emit = this.originalEmit;
};

/**
	Fake emitter that overrides the original emit function
 */
proto.fakeEmitter = function(event) {
	// create a history object for this event
	this.history[event] = this.history[event] || [];
	// push arguments passed to emit to history
	// slice removes the event name
	this.history[event].push(slice.call(arguments, 1));
	// let the original emit handle it
	this.originalEmit.apply(this.emitter, arguments);
	// also trigger an event on the watcher
	EventEmitter.prototype.emit.apply(this, arguments);
};

/**
	Override emit function to also emit on the original emitter
 */
proto.emit = function() {
	// fakeEmitter automatically sets the right context
	this.emitter.emit.apply(null, arguments);
};

/**
	Asserts that listeners were called an expected number of times
		- it is also important to do negative assertions so this function can also make sure only the expected events are emitted

	@method assertCount
	@param {Object} expectedCounts Key value map of how often an event should have been called
	@param {Boolean} [strict=false] Whether negative assertions should be performed
 */
proto.assertCount = function(expectedCounts, strict) {
	var actualEvents = Object.keys(this.history);
	var expectedEvents = Object.keys(expectedCounts);

	// ensure all emitted events meet expectation
	actualEvents.forEach(function(event) {
		var history = this.history[event];
		var actual = history.length;
		var expected = expectedCounts[event];

		if (strict) {
			assert(expected, 'Expected `' + event + '` to not be emitted.');
		}

		if (expected) {
			assert.equal(actual, expected, 'Expected `' + event + '` to be emitted ' + expected + ' times instead of ' + actual);
		}
	}, this);

	// also ensure **ALL** expected events were emitted
	expectedEvents.forEach(function(event) {
		var count = expectedCounts[event];
		// only bother if count > 0
		if (count > 0) {
			// if the event was never emitted
			assert(actualEvents.indexOf(event) > -1, 'Expected `' + event + '` to be emitted ' + count + ' times but it was never emitted');
		}
	});
};

/**
	Reset history of watcher
 */
proto.resetHistory = function() {
	this.history = {};
};

/**
	Get history for a particular event

	@param {String} event
 */
proto.getHistory = function(event) {
	return this.history[event];
};

module.exports = Watcher;