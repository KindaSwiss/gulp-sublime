'use strict';
/**
 * Note: Run the tests with server in Sublime Text running
 */

var assert = require('chai').assert;
var expect = require('chai').expect;

var sublime = require('./../index').config({
	deferConnect: true, disableLogging: true
});
var Sublime = sublime.constructor;

describe('Sublime', function() {
	it('It should be a function', function () {
		expect(Sublime).to.be.an('function');
	});

	it('Should be return an object', function () {
		expect(Sublime()).to.be.an('object');
	});

	it('The object returned should be an event emitter', function () {
		expect(Sublime()).to.have.property('on').that.is.a.function;
		expect(Sublime()).to.have.property('_events').that.is.a.object;
	});

	it('Should accept an object as an arguments that is assigned to the settings', function () {
		expect(Sublime({ cool: 123 }).settings.get('cool')).to.equal(123);
	});

	it('Should connect and disconnect without issues when using the callbacks', function (done) {
		var sublime = Sublime({ disableLogging: true });

		sublime.connect(function () {
			sublime.disconnect(function () {
				sublime.connect(function () {
					sublime.disconnect(function () {
						done();
					});
				});
			});
		});
	});

	describe('#connect', function () {
		it('Should be defined as a function', function () {
			expect(Sublime())
				.to.have.property('connect')
				.that.is.an('function');
		});

		it('Should call the callback function when the socket connects', function (done) {
			var sublime = Sublime({ disableLogging: true });

			sublime.connect(function () {
				done();
				sublime.disconnect();
			});
		});

		it('Should assign a socket object to the "_connection" property of sublime', function () {
			var sublime = Sublime({ disableLogging: true });

			sublime.on('connect', function () {
				expect(sublime)
					.to.have.property('_connection')
					.that.is.an('object');
					sublime.disconnect();
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

		it('Should fire the callback passed when the socket is connected', function (done) {
			var sublime = Sublime({ disableLogging: true });

			sublime.on('connect', function () {
				sublime.disconnect(function () {
					done();
				});
			});

			sublime.connect();
		});
	}); // #disconnect

	describe('#showError', function () {
		var sublime = Sublime({ disableLogging: true });

		it('Should send a command with an "args", "init_args", and "name" property', function () {
			var error = {
				file: 'C:\\testing\\this\\thing.js',
				line: 123,
				column: 2
			};
			var id = 'sass';

			sublime.on('run:before', function (command) {
				var data = command.data;

				expect(command).to.be.an.object;
				expect(command).to.have.property('name').that.equals('show_error');

				expect(data).to.be.a.object;
				expect(data).to.have.property('args');
				expect(data.init_args).to.have.property('views').to.be.a('array').to.include(error.file);
			});

			sublime.showError(error, id);
		});

		it('Should error when not passed an id', function () {
			expect(sublime.showError.bind(sublime)).to.throw(/The ID passed is not of type String/);
		});
	}); // #showError

	describe('event#run', function () {
		var sublime = Sublime();

		it('Should be emitted with command data', function () {
			sublime.on('run:before', function (command) {
				expect(command).to.be.object;
			});
		});

		sublime.showError({}, 'sass');
	});

	describe('event#connect', function () {
		it('Should be fired after connecting', function (done) {
			Sublime({ disableLogging: true }).on('connect', function () {
				done();
			}).connect(function () { this.disconnect(); });
		});
	});

	describe('event#disconnect', function () {
		it('Should be fired after disconnecting', function (done) {
			Sublime({ disableLogging: true }).on('disconnect', function () {
				done();
			}).connect(function () { this.disconnect(); });
		});
	});

	describe('event#receive', function () {
		it('Should be fired after connecting and receiving the handshake', function (done) {
			Sublime({ disableLogging: true }).on('receive', function (data) {
				expect(data).to.be.object;
				done();
				this.disconnect();
			}).connect();
		});
	});
}); // Sublime