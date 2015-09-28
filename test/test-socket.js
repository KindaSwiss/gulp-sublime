'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;

var utils = require('./../utils');

var PORT = 30048;




describe('socket', function() {

	describe('It should be an object', function () {
		var socket = utils.createSocket({
			host: 'localhost',
			port: PORT,
		});
		expect(socket).to.be.an('object');
	});

	describe('#send', function () {
		it('Should be defined as a function', function () {
			var socket = utils.createSocket({
				host: 'localhost',
				port: PORT,
			});
			expect(socket)
				.to.have.property('send')
				.that.is.an('function');
		});
	});

	describe('events', function() {
		it('Should fire the connect event handler passed after creation', function (done) {
			var socketEvents = {
				connect: function onSocketConnected() {
					socket.destroy();
					done();
				},
			}

			var socket = utils.createSocket({
				host: 'localhost',
				port: PORT,
				events: socketEvents
			});
		});

		it('Should fire the close event after calling destroy', function (done) {
			var socketEvents = {
				close: function onSocketClosed() {
					done();
				},
			}

			var socket = utils.createSocket({
				host: 'localhost',
				port: PORT,
				events: socketEvents
			});
			socket.destroy();
		});

	});
});