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

var _config2 = require('./config');

var _config3 = _interopRequireDefault(_config2);

var PLUGIN_ID = _config3['default'].PLUGIN_ID;
var PLUGIN_NAME = _config3['default'].PLUGIN_NAME;
var PORT = _config3['default'].PORT;
var RECONNECT_TIMEOUT = _config3['default'].RECONNECT_TIMEOUT;
var MAX_TRIES = _config3['default'].MAX_TRIES;

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

		var id = 'gulp#' + PLUGIN_ID;
		var handshake = { id: id };
		this.send(handshake);

		sublime.emit('connect');
	},
	/**
  * Handle when data is received
  */
	data: function onSocketReceived(data) {}
};

/**
 * Whether or not the socket is connected.
 * @type {Boolean}
 */
var connected = false;

/**
 * The name of the current task being run.
 * @type {String}
 */
var currentTask = null;

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
		this.emit('connect:before');

		if (connected) {
			// The socket will call _reconnect when it is closed
			this.disconnect();
		} else {
			this._connection = (0, _utils.createSocket)({
				host: 'localhost',
				port: _config3['default'].port,
				on: socketEventHandlers
			});
		}

		return this;
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

		// Adds a temporary listener
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

		return this;
	},

	config: function config(options) {
		if (Number.isFinite(options.port)) {
			_config3['default'].port = options.port;
		}

		if (options.gulp !== undefined) {
			_config3['default'].gulp = options.gulp;
		}

		_config3['default'].dev = !!options.dev;

		sublime.connect();

		return this;
	},

	/**
  * Run a gulp command in Sublime Text.
  *
  * @param  {Object} command
  * @return {void}
  */
	run: function run(command) {
		this.emit('run:before');

		var args_id = command.data.args.id;
		if (typeof args_id === 'string') {
			command.data.args.id = args_id + '#' + _config3['default'].PLUGIN_ID;
		}

		sublime._connection.send(command);

		this.emit('run');

		return this;
	},

	/**
  * Set a status message in Sublime
  *
  * @param  {String} id     The id of the status message
  * @param  {String} status The message that will be shown
  * @return {void}
  */
	setStatus: function setStatus(id, status) {
		var args = { id: id, status: status };
		var init_args = { views: '<all>' };
		var command = (0, _utils.Command)({ name: 'set_status', args: args, init_args: init_args });
		sublime.run(command);

		return this;
	},

	/**
  * Erase a status message in Sublime Text's status bar
  *
  * @param  {String} id The id of the status message
  */
	eraseStatus: function eraseStatus(id) {
		var args = { id: id };
		var init_args = { views: '<all>' };
		var command = (0, _utils.Command)({ name: 'erase_status', args: args, init_args: init_args });
		sublime.run(command);

		return this;
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

		var args = { id: id };
		var init_args = { views: '<all>' };
		var command = (0, _utils.Command)({ name: 'erase_errors', args: args, init_args: init_args });
		sublime.run(command);

		return this;
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

		var args = { id: id, error: error };
		var init_args = { views: [error.file] };
		var command = (0, _utils.Command)({ name: 'show_error', args: args, init_args: init_args });
		sublime.run(command);

		return this;
	}
};

// Turn `sublime` into an event emitter
(0, _objectAssign2['default'])(SublimeProto, _events.EventEmitter.prototype);
var sublime = Object.create(SublimeProto);
_events.EventEmitter.call(sublime);

sublime.on('connect', function onSublimeConnect() {
	var gulp = _config3['default'].gulp;

	if (typeof gulp === 'object') {
		gulp.removeListener('task_start', onGulpTaskStart);
		gulp.on('task_start', onGulpTaskStart);
	}

	reconnectTries = 0;
	sublime.connected = connected = true;
});

sublime.on('disconnect', function onSublimeDisconnect() {
	sublime.connected = connected = false;

	if (shouldReconnect) {
		sublime._reconnect();
	}
});

exports['default'] = sublime;
module.exports = exports['default'];

// const received = JSON.parse(data.toString());