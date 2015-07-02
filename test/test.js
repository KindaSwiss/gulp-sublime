'use strict';
/*
	Note: Run the tests with server in Sublime Text running 

 */
var assert = require('chai').assert;
var expect = require('chai').expect;


var sublime = require('./../index');
var utils = require('./../utils');

// Tell sublime to not reconnect after disconnecting 
sublime.config({
	shouldReconnect: false,
});


var PORT = 30048;



describe('socket', function() {
	var handshake = { "id": "gulp" };

	var socketEvents = {
		close: function onSocketClosed() {
		},
		error: function onSocketError() {
			this.destroy();
		},
		connect: function onSocketConnected() {
			this.send(handshake);
		},
		data: function onSocketReceived(data) {
		}
	}

	var socket = utils.createSocket({
		host: 'localhost', 
		port: PORT, 
		on: socketEvents
	});

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
	beforeEach(function () {
		sublime.removeAllListeners('connect');
		sublime.removeAllListeners('disconnect');
	});

	it('It should be an object', function () {
		expect(sublime).to.be.an('object');
	});

	it('It should be an event emitter', function () {
		expect(sublime)
			.to.have.property('_events')
			.that.is.a('object')
	});

	describe('#connect', function () {

		it('Should be defined as a function', function () {
			expect(sublime)
				.to.have.property('connect')
				.that.is.an('function');
		});


		it('Should assign a socket object to the "_connection" property of sublime', function () {
			sublime.on('connect', function () {
				expect(sublime)
					.to.have.property('_connection')
					.that.is.an('object');
			});
			sublime.connect();
		});

		it('Should assign true to the "connected" property of sublime', function (done) {
			sublime.on('connect', function () {
				expect(sublime)
					.to.have.property('connected')
					.to.be.true;
				
				done();
			});
			sublime.connect();
		});
	}); // #connect


	describe('#disconnect', function () {

		it('Should be defined as a function', function () {
			expect(sublime)
				.to.have.property('disconnect')
				.that.is.an('function');
		});

		it('Should add the callback to socket._events and close the socket causing the callback to be run when the socket closes', function (done) {
			sublime.on('connect', function () {
				sublime.disconnect(function () {
					done();
				});
			});
			sublime.connect();
		});

		it('Should assign false to the "connected" property on the sublime object', function (done) {
			sublime.on('connect', function () {
				sublime.disconnect(function () {
					expect(sublime)
						.to.have.property('connected')
						.that.is.false;
					done();
				});
			});

			sublime.connect();
		});
	}); // #disconnect 


	describe('#showError', function () {

		it('Should be defined as a function', function () {
			expect(sublime)
				.to.have.property('showError')
				.that.is.an('function');
		});

	}); // #showError

	describe('#setStatus', function () {
		it('Should be defined as function', function() {
			expect(sublime)
			.to.have.property('setStatus')
			.that.is.a('function')
		});
	}); // #setStatus

}); // sublime







