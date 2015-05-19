'use strict';

var util = require('util');
var path = require('path');

var mapStream = require('map-stream');
var gutil = require('gulp-util');

var utils = require('./utils');
var make_command = utils.make_command;

var createSocket = require('./socket').createSocket;
var List = require('./lib/list');




var PLUGIN_NAME = 'SublimeJS';




/**
 * The port to connect to Sublime Text
 * @type {Number}
 */
var PORT = 30048;




/**
 * The maximum number of times the socket will try to reconnect to sublime 
 * @type {Integer}
 */
var MAX_TRIES = 10;
var RECONNECT_TIMEOUT = 1000;




var IS_FAILURE = 0;
var IS_SUCCESS = 1;




/**
 * This array holds handlers added by sublime.disconnect. 
 * Each callback is removed right after it is called 
 * @type {Array}
 */
var tempDisconnectHandlers = [];




var socketEventHandlers = {
	/**
	 * Handle sublime._connection socket close event.
	 *
	 */
	close: function onSocketClosed() {
		// console.log('Connection closed');
		sublime.connected = connected = false;
		
		while (tempDisconnectHandlers.length) {
			var listener = tempDisconnectHandlers.shift();
			listener();
		}

		sublime._reconnect();
	},
	/**
	 * Destroy the socket on error 
	 */
	error: function onSocketError() {
		// console.log('Socket error')
		this.destroy();
	},
	/**
	 * Connect to Sublime Text's server 
	 */
	connect: function onSocketConnected() {
		sublime._tries = 0;
		sublime.connected = connected = true;
		// console.log('Connected to server: %s', sublime.connected);

		var handshake = { "id": "gulp" };
		this.send(handshake);
	},
	/**
	 * Handle when data is received 
	 */
	data: function onSocketReceived(data) {
		var received = JSON.parse(data.toString());
	}
};




/**
 * A list of commands to run after a task has been finished. 
 *
 * Basically a way to accumulate data for all files for a single 
 * command. When a task is run the queue is reset. The commands are sent 
 * when a task finishes.
 *
 * The commands are sent when a task finishes and is reset 
 * when a task is run. 
 * 
 * @type {List}
 */
var commandQueue = List();




/**
 * Whether or not the socket is connected
 * @type {Boolean}
 */
var connected = false;
var currentTask = null;




var sublime = {
	_connection: null,
	_tries: 0,
	connected: false,
	/**
	 * Reconnect to sublime server 
	 * @param {Function} onConnectHandler
	 */
	_reconnect: function (onConnectHandler) {
		this._tries++;
		if (this._tries > MAX_TRIES) {
			return console.log('Max reconnect tries exceeded');
		}

		setTimeout(function () {
			this._connection = createSocket({
				port: PORT,
				on: socketEventHandlers
			}, onConnectHandler);
		}.bind(this), RECONNECT_TIMEOUT);
	},
	/**
	 * Connect the server to sublime 
	 *
	 * The options may contain a port and socket event handlers. If no port is defined, 
	 * the default port will be used. 
	 * 
	 * @param {Object} options
	 * @param {Funtion} onConnectHandler
	 */
	connect: function (options, onConnectHandler) {
		var port = typeof options === 'object' && util.isNumber(options.port) ? options.port : PORT;
		
		if (this._connection) {
			this._connection.destroy();
		}

		if (typeof options === 'function') {
			onConnectHandler = options;
		}

		this._connection = createSocket({
			host: 'localhost',
			port: port,
			on: socketEventHandlers
		}, onConnectHandler);
	},
	/**
	 * Disconnect the socket from Sublime Text's server 
	 * @param  {Function} onDisconnectHandler
	 */
	disconnect: function (onDisconnectHandler) {
		if (this._connection) {
			if (typeof onDisconnectHandler === 'function' && connected) {
				tempDisconnectHandlers.push(onDisconnectHandler);
			}
			this._connection.destroy();
		}
	},
	config: function (options) {
		var gulp = options.gulp;
		if (util.isNumber(options.port)) {
			PORT = options.port;
		}
		sublime.connect(function () {
			gulp.on('task_start', function (task) {
				if (task.task === 'default') { return; }
				sublime.erase_errors(task.task);
				currentTask = task.task;
				commandQueue = List();
				console.log(task);
			});
			gulp.on('task_stop', function (task) {
				currentTask = null;
				console.log('Task stopped, commands queued:', commandQueue.length);
				commandQueue.each(function (command) {
					sublime._connection.send(command);
				});
			});
		});
	},
	/**
	 * Set a status message in Sublime 
	 * @param {String} id     The id of the status message
	 * @param {String} status The message that will be shown 
	 */
	set_status: function(id, status) {
		sublime.run('set_status', 
			{ id: id, status: status }, { views: '<all>' });
	},
	/**
	 * Erase a status message in Sublime Text's status bar 
	 * @param  {String} id The id of the status message
	 */
	erase_status: function (id) {
		sublime.run('erase_status', 
			{ id: id }, { views: '<all>' });
	},
	/**
	 * Run a gulp command in Sublime Text
	 * @param  {String} command_name  The command to run 
	 * @param  {Object} args          The arguments to pass to the command 
	 * @param  {Object} init_args     The command __init__ arguments 
	 */
	run: function (command_name, args, init_args) {
		sublime._connection.send(make_command(command_name, args, init_args));
	},
	/**
	 * Hide the gutters, highlighted text lines, and error status messages
	 *
	 * @param  {String} id  The id of the status message to erase 
	 */
	erase_errors: function (id) {
		if ( ! util.isString(id)) {
			throw new Error('The ID passed is not of type String');
		}
		return sublime.run('erase_errors', { id: id }, { views: '<all>' });
	},
	/**
	 * Runs the gulp command "show_error". The command will do several things 
	 * based on if they have been enabled in the package settings. 
	 *
	 * - Show a popup message in a view with the same open file that caused the error
	 * - Show a gutter icon next to the line the caused the error 
	 * - Show an error message in the status bar 
	 * - Scroll to the line where the error occured 
	 * 
	 * @param  {String} id   The id to associate with the status message
	 * @param  {Error}  err  The gulp error object 
	 */
	show_error: function(id, err) {
		if (typeof id !== 'string') {
			throw new Error('The ID passed is not of type String');
		}
		if ( ! util.isObject(err)) {
			throw new Error('Invalid error object');
		}
		
		var error = utils.normalizeError(err);
		var file = error.file;
		sublime.run('show_error', { id: id, error: error }, { views: [file] });
	},
	// https://github.com/spalger/gulp-jshint/issues/50
	// Error: map stream is not writable
	/**
	 * A JSHint reporter 
	 * @param  {String} id
	 * @return {map-stream}
	 */
	reporter: function (id) {
		if (typeof id !== 'string') {
			throw new gutil.PluginError(PLUGIN_NAME, 'The ID passed to "sublime.reporter" is not of type string');
		}
		
		var uid = Math.random();

		return mapStream(function (file, cb) {

			// Find the command to add more data to it 
			// The command will be run when the task ends 
			var command = commandQueue.whereOne('uid', uid);
			var report = file.jshint;

			if ( ! command) {
				var command = make_command('report', { reports: [report], id: id });
				command.uid = uid;
				commandQueue.append(command);
			}
			
			command.data.args.reports.push(report);

			cb(null, file);
		});
	}

};


module.exports = sublime;





