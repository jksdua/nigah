/* jshint node:true */
/* globals describe, beforeEach, afterEach, it */

'use strict';

var chai = require('chai');
var expect = chai.expect;
var events = require('events');

var nigah = require(__dirname);

var emitter, watcher;

beforeEach(function() {
	emitter = new events.EventEmitter();
	watcher = nigah(emitter);
});

afterEach(function() {
	watcher.restore();
});

// emit calls are also here rather than in a before block since the event listener needs to be attached before events are emitted
it('should still emit the original events', function(done) {
	emitter.once('another event', function(arg1, arg2, arg3) {
		expect(arg1).to.equal(4);
		expect(arg2).to.equal(5);
		expect(arg3).to.equal(6);
		done();
	});

	// make it happen
	emitter.emit('some event', 0, 0, 0);
	emitter.emit('some event', 1, 2, 3);
	emitter.emit('another event', 4, 5, 6);
});

it('should return the correct history', function() {
	// make it happen
	emitter.emit('some event', 0, 0, 0);
	emitter.emit('some event', 1, 2, 3);
	emitter.emit('another event', 4, 5, 6);

	var someEventHistory = watcher.getHistory('some event');
	expect(someEventHistory).to.eql([[0, 0, 0], [1, 2, 3]]);
	var anotherEventHistory = watcher.getHistory('another event');
	expect(anotherEventHistory).to.eql([[4, 5, 6]]);
});

describe('#assertCount', function() {
	it('should work in non strict mode', function() {
		// make it happen
		emitter.emit('some event', 0, 0, 0);
		emitter.emit('some event', 1, 2, 3);
		emitter.emit('another event', 4, 5, 6);

		expect(function() {
				watcher.assertCount({
				'some event': 2,
				/* 'another event': 1, // not included */
				'non existent event': 0
			}, false);
		}).to.not.throw();
	});

	it('should work in strict mode', function() {
		// make it happen
		emitter.emit('some event', 0, 0, 0);
		emitter.emit('some event', 1, 2, 3);
		emitter.emit('another event', 4, 5, 6);

		expect(function() {
			watcher.assertCount({
				'some event': 2,
				'another event': 1,
				'non existent event': 0
			});
		}).to.not.throw();
	});

	it('should throw an assertion error if an event was not emitted', function() {
		// make it happen
		emitter.emit('some event', 0, 0, 0);
		emitter.emit('some event', 1, 2, 3);
		emitter.emit('another event', 4, 5, 6);

		expect(function() {
			watcher.assertCount({
				'some event': 3, // should be 2
				'another event': 1
			});
		}).to.throw();
	});

	it('should throw an assertion error if an event was not expected', function() {
		// make it happen
		emitter.emit('some event', 0, 0, 0);
		emitter.emit('some event', 1, 2, 3);
		emitter.emit('another event', 4, 5, 6);

		expect(function() {
			watcher.assertCount({
				'some event': 2,
				'non existent event': 1
			});
		}).to.throw();
	});
});

it('should also emit the same events on the watcher', function(done) {
	watcher.once('some event', function(a) {
		expect(a).to.equal(0);
		done();
	});

	emitter.emit('some event', 0, 0, 0);
});

it('should emit events emitted on the watcher', function(done) {
	// by listening on the original emitter, we assert that it was emitted on the original emitter
	emitter.once('some event', function() {
		// if it was emitted on the original emitter, it should also be caught by the watcher
		watcher.assertCount({
			'some event': 1
		});

		done();
	});

	watcher.emit('some event', 0, 0, 0);
});

it('should restore the emitter', function() {
	var currentFn = emitter.emit;
	watcher.restore();
	expect(currentFn).to.not.equal(emitter.emit);
});