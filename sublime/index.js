'use strict';

var util = require('util');
var path = require('path');

var mapStream = require('map-stream');
var gutil = require('gulp-util');

var make_command = require('./utils').make_command;
var normalizeError = require('./utils').normalizeError;

var createSocket = require('./socket').createSocket;
var _ = require('lodash');
var DEV = false;



var PLUGIN_NAME = 'gulp-sublime';




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
 * @type {Array}
 */
var commandQueue = [];




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
	 * 
	 * @param  {Function} onConnectHandler
	 * @return {void}
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
	 * @param  {Object}  options
	 * @param  {Funtion} onConnectHandler
	 * @return {void}
	 */
	connect: function (options, onConnectHandler) {
		var err, 
			options = options || {},
			port = PORT;
		
		if (_.isFinite(options.port)) {
			port = options.port;
		}
		
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
	 * Disconnect the socket from Sublime Text's server. 
	 * The callback passed is only used once. 
	 * 
	 * @param  {Function} onDisconnectHandler
	 * @return {void}
	 */
	disconnect: function (onDisconnectHandler) {
		if (this._connection) {
			if (typeof onDisconnectHandler === 'function' && connected) {
				tempDisconnectHandlers.push(onDisconnectHandler);
			}
			this._connection.destroy();
		}
	},



	/**
	 * Configure the sublime module 
	 * 
	 * @param  {Object}  options
	 * @param  {Integer} options.port
	 * @param  {Object}  options.gulp
	 * @return {void}
	 */
	config: function (options) {
		options = options || {};
		var gulp = options.gulp;
		module.exports.DEV = DEV !!options.dev || false;
		
		if (_.isFinite(options.port)) {
			PORT = options.port;
		}

		sublime.connect(function () {
			gulp.on('task_start', function (task) {
				if (task.task === 'default') { return; }
				sublime.erase_errors(task.task);
				currentTask = task.task;
				commandQueue = [];
				console.log(task);
			});
			gulp.on('task_stop', function (task) {
				currentTask = null;
				console.log('Task stopped, commands queued:', commandQueue.length);
				_.each(commandQueue, function (command) {
					sublime._connection.send(command);
				});
			});
		});
	},




	/**
	 * Set a status message in Sublime 
	 * 
	 * @param  {String} id     The id of the status message
	 * @param  {String} status The message that will be shown 
	 * @return {void}
	 */
	set_status: function(id, status) {
		sublime.run('set_status', 
			{ id: id, status: status }, { views: '<all>' });
	},




	/**
	 * Erase a status message in Sublime Text's status bar 
	 * 
	 * @param  {String} id The id of the status message
	 */
	erase_status: function (id) {
		sublime.run('erase_status', 
			{ id: id }, { views: '<all>' });
	},




	/**
	 * Run a gulp command in Sublime Text
	 * 
	 * @param  {String} command_name  The command to run 
	 * @param  {Object} args          The arguments to pass to the command 
	 * @param  {Object} init_args     The command __init__ arguments 
	 * @return {void}
	 */
	run: function (command_name, args, init_args) {
		sublime._connection.send(make_command(command_name, args, init_args));
	},




	/**
	 * Hide the gutters, highlighted text lines, and error status messages
	 *
	 * @param  {String} id  The id of the status message to erase 
	 * @return {void}
	 */
	erase_errors: function (id) {
		var err;
		if ( ! util.isString(id)) {
			err = new Error('The ID passed is not of type String');
			throw err;
		}
		sublime.run('erase_errors', { id: id }, { views: '<all>' });
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
	 * @return {void}
	 */
	show_error: function(id, error) {
		var err;

		if (typeof id !== 'string') {
			err = new Error('The ID passed is not of type String');
			throw err;
		}
		
		error = normalizeError(error);
		var file = error.file;
		sublime.run('show_error', { id: id, error: error }, { views: [file] });
	},




	// https://github.com/spalger/gulp-jshint/issues/50
	// Error: map stream is not writable
	/**
	 * A JSHint reporter 
	 * 
	 * @param  {String} id
	 * @return {map-stream}
	 */
	reporter: function (id) {
		if (typeof id !== 'string') {
			throw new gutil.PluginError(PLUGIN_NAME, 'The ID passed to "sublime.reporter" is not of type string');
		}
		
		var uid = _.uniqueId();

		return mapStream(function (file, cb) {

			// Find the command to add more data to it 
			// The command will be run when the task ends 
			var command = _(commandQueue).where({ uid: uid }).first();
			var report = file.jshint;

			if ( ! command) {
				var command = make_command('report', { reports: [report], id: id });
				command.uid = uid;
				commandQueue.push(command);
			}
			
			command.data.args.reports.push(report);

			cb(null, file);
		});
	}

};




module.exports = sublime;
module.exports.DEV = DEV;



