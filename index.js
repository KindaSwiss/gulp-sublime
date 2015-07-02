'use strict';
Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/* globals sublime */

var _utils = require('./utils');

var _events = require('events');

var _mapStream = require('map-stream');

var _mapStream2 = _interopRequireDefault(_mapStream);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _gulp = require('gulp');

var _gulp2 = _interopRequireDefault(_gulp);

var PLUGIN_NAME = 'gulp-sublime';

/**
 * The maximum number of times the socket will try to 
 * reconnect to Sublime Text. 
 * @type {Number}
 */
var MAX_TRIES = 10;

/**
 * The default port to connect to Sublime Text. 
 * @type {Number}
 */
var PORT = 30048;

/**
 * The timeout before the next reconnect 
 * @type {Number}
 */
var RECONNECT_TIMEOUT = 2000;

/**
 * Fires when a file changes. The file that initiated the 
 * changes are stored in `taskInitiatior`. 
 * @param  {Event} event 
 * @return {void}       
 */
var onWatchChange = function onWatchChange(event) {
	taskInitiator = event.path;
};

/**
 * Sets the current task and resets the command queue. 
 * @param  {Object} task 
 * @return {void}        
 */
var onGulpTaskStart = function onGulpTaskStart(task) {
	if (task.task === 'default') {
		return;
	}
	currentTask = task.task;
	sublime.eraseErrors(task.task);
	commandQueue = [];
};

/**
 * Runs the commands in the queue. 
 * @param  {Object} task 
 * @return {void}        
 */
var onGulpTaskStop = function onGulpTaskStop(task) {
	commandQueue.forEach(function (command) {
		sublime.run(command);
	});
};

/**
 * Handlers for the socket events. 
 * @type {Object}
 */
var socketEventHandlers = {
	/**
  * Handle sublime._connection socket close event.
  *
  */
	close: function onSocketClosed() {
		(0, _utils.log)('Connection closed');
		sublime.emit('disconnect');
	},
	/**
  * Destroy the socket on error 
  */
	error: function onSocketError() {
		(0, _utils.log)('Socket error');
		this.destroy();
	},
	/**
  * Connect to Sublime Text's server 
  */
	connect: function onSocketConnected() {
		(0, _utils.log)('Connected to server');

		var handshake = { 'id': 'gulp' };
		this.send(handshake);

		sublime.emit('connect');
	},
	/**
  * Handle when data is received 
  */
	data: function onSocketReceived(data) {}
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
 * Whether or not the socket is connected. 
 * @type {Boolean}
 */
var connected = false;

/**
 * The name of the current task being run. 
 * @type {}
 */
var currentTask = null;

/**
 * The name of the file that initiated a task via watch. 
 * @type {String}
 */
var taskInitiator = '';

/**
 * Used by utils.log to check if we should log. 
 * @type {Boolean}
 */
var dev = false;

/**
 * The port to connect to Sublime Text on.
 * @type {Number}
 */
var port = PORT;

/**
 * The number of times we have tried to reconnect. 
 * @type {Number}
 */
var reconnectTries = 0;

/**
 * Whether or not to reconnect to Sublime Text after 
 * the socket is closed. 
 * @type {Boolean}
 */
var shouldReconnect = true;

var SublimeProto = {
	_connection: null,
	connected: false,

	/**
  * Reconnect to sublime server 
  *
  * FIXME: Calling _reconnect or connect twice in a row causes
  * two sockets to connect.  
  * @param  {Function} onConnectHandler
  * @return {void}
  */
	_reconnect: function _reconnect() {
		var _this = this;

		reconnectTries++;
		(0, _utils.log)('Reconnecting, attempt %s', reconnectTries);

		if (reconnectTries > MAX_TRIES) {
			return (0, _utils.log)('Max reconnect tries exceeded');
		}

		setTimeout(function () {
			_this.connect();
		}, RECONNECT_TIMEOUT);
	},

	/**
  * Connect the server to sublime. The previous socket will
  * be disconnected. 
  *
  * @return {void}
  */
	connect: function connect() {
		var _this2 = this;

		this.emit('connect:before');

		var connect = function connect() {
			_this2._connection = (0, _utils.createSocket)({
				host: 'localhost',
				port: port,
				on: socketEventHandlers
			});
		};

		if (connected) {
			console.log('already connected, disconnecting');
			// The socket will call _reconnect when it is closed
			this.disconnect();
		} else {
			console.log('not connected, connecting');
			connect();
		}
	},

	/**
  * Disconnect the socket from Sublime Text's server. 
  * Never call sublime.connect from the onDisconnect listener. 
  * 
  * @param {Function} onDisconnect 
  * @return {void}
  */
	disconnect: function disconnect(onDisconnect) {
		var reconnectAfterDisconnect = arguments[1] === undefined ? true : arguments[1];

		this.emit('disconnect:before');
		var socket = this._connection;

		var listenerWrapper = function listenerWrapper() {
			shouldReconnect = !!reconnectAfterDisconnect;

			if (typeof onDisconnect === 'function') {
				onDisconnect();
			}

			socket.removeListener('close', listenerWrapper);
		};
		this._connection.on('close', listenerWrapper);

		if (this._connection) {
			this._connection.destroy();
		}
	},

	/**
  * Configure settings
  * 
  * @param  {Object}  options
  * @param  {Number} options.port
  * @return {void}
  */
	config: function config() {
		var options = arguments[0] === undefined ? {} : arguments[0];

		if (Number.isFinite(options.port)) {
			port = options.port;
		}

		_utils.log.dev = !!options.dev;

		// if the port is the same then don't reconnect
		if (port === PORT) {
			return;
		}

		if ('shouldReconnect' in options) {
			shouldReconnect = !!options.shouldReconnect;
		}

		if (shouldReconnect) {
			// Reconnect using the new port
			sublime._reconnect();
		}
	},

	/**
  * Used for setting the name of the file that initiated 
  * the task. 
  * @param  {Array} watchers 
  * @return {void}           
  */
	watchers: function watchers(_watchers) {
		_watchers.forEach(function (watcher) {
			watcher.removeListener('change', onWatchChange);
			watcher.on('change', onWatchChange);
		});
	},

	/**
  * Set a status message in Sublime 
  * 
  * @param  {String} id     The id of the status message
  * @param  {String} status The message that will be shown 
  * @return {void}
  */
	setStatus: function setStatus(id, status) {
		sublime.run('set_status', { id: id, status: status }, { views: '<all>' });
	},

	/**
  * Erase a status message in Sublime Text's status bar 
  * 
  * @param  {String} id The id of the status message
  */
	eraseStatus: function eraseStatus(id) {
		sublime.run('erase_status', { id: id }, { views: '<all>' });
	},

	/**
  * Run a gulp command in Sublime Text. 
  * 
  * `command` is a premade command object, or a command name. 
  * 
  * `args` is the arguments passed to the command's classes's 
  * run function (in Sublime Text). 
  * 
  * `init_args` is the arguments for the command classes's __init__ arguments 
  * 
  * @param  {String|Object} command 
  * @param  {Object} args               
  * @param  {Object} init_args            
  * @return {void}
  */
	run: function run(command, args, init_args) {
		this.emit('run:before');

		if (typeof command === 'string') {
			command = (0, _utils.makeCommand)(command, args, init_args);
		}

		command.data.args.task_initiator = taskInitiator;
		sublime._connection.send(command);
		this.emit('run');
	},

	/**
  * Hide the gutters, highlighted text lines, and error status messages
  *
  * @param  {String} id  The id of the status message to erase 
  * @return {void}
  */
	eraseErrors: function eraseErrors(id) {
		if (typeof id !== 'string') {
			var err = new Error('The ID passed is not of type String');
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
	showError: function showError(error) {
		var id = arguments[1] === undefined ? currentTask : arguments[1];

		if (typeof id !== 'string') {
			var err = new Error('The ID passed is not of type String');
			throw err;
		}

		error = (0, _utils.normalizeError)(error, id);
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
	reporter: function reporter() {
		var id = arguments[0] === undefined ? currentTask : arguments[0];

		var uid = (0, _utils.uniqueId)();

		return (0, _mapStream2['default'])(function (file, cb) {

			// Find the command to add more data to it
			// The command will be run when the task ends
			var command = (0, _utils.where)(commandQueue, 'uid', uid).unshift();

			var report = file.jshint;

			if (!command) {
				command = (0, _utils.makeCommand)('report', { reports: [report], id: id });
				command.uid = uid;
				commandQueue.push(command);
			}

			command.data.args.reports.push(report);

			return cb(null, file);
		});
	}

};

// Turn `sublime` into an event emitter
(0, _objectAssign2['default'])(SublimeProto, _events.EventEmitter.prototype);
var sublime = Object.create(SublimeProto);
_events.EventEmitter.call(sublime);

sublime.on('connect', function onSublimeConnect() {
	_gulp2['default'].removeListener('task_start', onGulpTaskStart);
	_gulp2['default'].removeListener('task_stop', onGulpTaskStop);
	_gulp2['default'].on('task_start', onGulpTaskStart);
	_gulp2['default'].on('task_stop', onGulpTaskStop);

	reconnectTries = 0;
	sublime.connected = connected = true;
});

sublime.on('disconnect', function () {
	sublime.connected = connected = false;

	if (shouldReconnect) {
		sublime._reconnect();
	}
});

sublime.connect();

exports['default'] = sublime;
module.exports = exports['default'];

// const received = JSON.parse(data.toString());