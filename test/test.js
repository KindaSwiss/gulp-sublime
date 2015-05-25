'use strict';
/*
	Note: Run the tests with server in Sublime Text running 
 */
// var sinon = require('sinon');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');
var path = require('path');


var sublime = require('../sublime')
var sockets = require('../sublime/socket');
var List = require('../sublime/lib/list');

var PORT = 30048;









describe('socket', function() {
	var handshake = { "id": "gulp", "action": -1 };

	var socketEvents = {
		close: function onSocketClosed() {
			// gutil.log('Connection closed');
		},
		error: function onSocketError() {
			// gutil.log('Socket error')
			this.destroy();
		},
		connect: function onSocketConnected() {
			gutil.log('Connected to server');
			this.send(handshake);
		},
		data: function onSocketReceived(data) {
			// var data = json.loads(data.toString());
		}
	}

	var socket = sockets.createSocket({ host: 'localhost', port: PORT, on: socketEvents });

	describe('It should be an object', function () {
		expect(socket).to.be.an('object');
	});

	describe('#send', function () {

		it('Should be defined as a function', function () {
			expect(socket)
				.to.have.property('send')
				.that.is.an('function');
		});

	});

	describe('#_events ', function() {

		// Force _events properties to be arrays by adding multiple listeners 
		socket.on('close', function () {})
		socket.on('error', function () {})
		socket.on('connect', function () {})
		socket.on('data', function () {})

		it('Should be an object', function() {
			expect(socket).to.have.property('_events');
		});

		it('Should have property "close" that is an array and with the first item being equal to onSocketClose', function () {
			expect(socket)
				.to.have.deep.property('_events.close')
				.that.is.a('array')
				.with.deep.property('[0]')
				.that.deep.equals(socketEvents.close);
		});

		it('Should have property "error" that is an array and with the first item being equal to onSocketError', function () {
			expect(socket)
				.to.have.deep.property('_events.error')
				.that.is.a('array')
				.with.deep.property('[0]')
				.that.deep.equals(socketEvents.error);
		});

		it('Should have property "connect" that is an array and with the first item being equal to onSocketConnect', function () {
			expect(socket)
				.to.have.deep.property('_events.connect')
				.that.is.a('array')
				.with.deep.property('[0]')
				.that.deep.equals(socketEvents.connect);
		});

		it('Should have property "data" that is an array and with the first item being equal to onSocketReceived', function () {
			expect(socket)
				.to.have.deep.property('_events.data')
				.that.is.a('array')
				.with.deep.property('[0]')
				.that.deep.equals(socketEvents.data);
		});

	});

});















describe('sublime', function() {

	it('It should be an object', function () {
		expect(sublime).to.be.an('object');
	});

	describe('#connect', function () {

		it('Should be defined as a function', function () {
			expect(sublime)
				.to.have.property('connect')
				.that.is.an('function');
		});

		it('Should add a listener to the "connect" event of the socket', function() {
			var listener = function listener() {};
			
			sublime.connect(listener);
			sublime._connection.on('connect', function () {});

			expect(sublime)
				.to.have.deep.property('_connection._events.connect')
				.that.is.an('array')
				.to.include(listener)
		});

		it('Should assign a socket object to the "_connection" property of sublime', function () {
			expect(sublime)
				.to.have.property('_connection')
				.that.is.an('object');
		});

		it('Should assign true to the "connected" property of sublime', function (done) {
			sublime.connect(function listenerDude() {
				expect(sublime)
					.to.have.property('connected')
					.to.be.true;

				done();
			});
		});
	}); // #connect

	describe('#set_status', function () {
		it('Should be defined as function', function() {
			expect(sublime)
			.to.have.property('set_status')
			.that.is.a('function')
		});
	}); // #set_status

	describe('#disconnect', function () {

		it('Should be defined as a function', function () {
			expect(sublime)
				.to.have.property('disconnect')
				.that.is.an('function');
		});

		it('Should add the callback to socket._events and close the socket causing the callback to be run when the socket closes', function (done) {
			sublime.connect(function () {
				sublime.disconnect(function () {
					done();
				});
			});
		});

		it('Should assign false to the "connected" property on the sublime object', function (done) {
			sublime.connect(function () {
				sublime.disconnect(function () {
					expect(sublime)
						.to.have.property('connected')
						.that.is.false;
					done();
				});
			});
			
		});
	}); // #disconnect 


	describe('#show_error', function () {

		it('Should be defined as a function', function () {
			expect(sublime)
				.to.have.property('show_error')
				.that.is.an('function');
		});

	}); // #show_error

}); // sublime







