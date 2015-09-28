'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('./utils');

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _events = require('events');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

/**
 * Default configuration options for a sublime object
 * @return {Object}
 */
var defaultSettings = (function () {
	/**
  * Whether or not to connect with the module is required
  * @type {Boolean}
  */
	var deferConnect = false;

	/**
  * The maximum number of times the socket will try to
  * reconnect to the server.
  * @type {Number}
  */
	var maxTries = 30;

	/**
  * The default port to connect to the server.
  * @type {Number}
  */
	var port = 30048;

	/**
  * The timeout before the next reconnect occurs.
  * @type {Number}
  */
	var reconnectTimeout = 2000;

	/**
  * Whether or not to automatically reconnect after disconnecting.
  * Note: Calling .disconnect() will cause the socket to remain
  * disconnected, even if this option is set to true.
  * @type {Boolean}
  */
	var automaticReconnect = true;

	/**
  * When true, messages will be logged to the console.
  * @type {Boolean}
  */
	var disableLogging = false;

	return Object.freeze({
		automaticReconnect: automaticReconnect,
		disableLogging: disableLogging,
		deferConnect: deferConnect,
		maxTries: maxTries,
		port: port,
		reconnectTimeout: reconnectTimeout
	});
})();

var SublimeProto = {
	_connection: null,
	connected: false,

	/**
 * When set to true, the socket will remain disconnected
 * rather than trying to reconnect.
 * @type {Boolean}
 */
	_remainDisconnected: false,

	/**
 * The number of times we have tried to reconnect.
 * @type {Number}
 */
	_reconnectTries: 0,

	/**
  * Reconnect to sublime server
  *
  * @param  {Function} onConnectHandler
  * @return {void}
  */
	_reconnect: function _reconnect() {
		var _this = this;

		this._reconnectTries++;

		if (this._reconnectTries > this.settings.get('maxTries')) {
			this.log('Max reconnect tries exceeded');
			return;
		}

		setTimeout(function () {
			_this.connect();
		}, this.settings.get('reconnectTimeout'));
	},

	/**
  * Creates a connection to the server. The previous socket will
  * be disconnected.
  *
  * When connected, subsequent calls are ignored. The socket
  * must be manually disconnected by calling .disconnect().
  * @param  {Function} onConnect
  * @return {void}
  */
	connect: function connect(onConnect) {
		var _this2 = this;

		// Are we still trying to connect from the previous .connect() call?
		var connecting = this._connection !== null && this._connection._connecting ? true : false;
		var connected = this._connection !== null && this._connection.connected ? true : false;

		this.emit('connect:before');
		this._remainDisconnected = false;

		/**
   * Handlers for the socket events.
   * @type {Object}
   */
		var socketEventHandlers = {
			/**
    * Handle socket close event.
    */
			close: function close() {
				_this2.log('Disconnected');
				_this2._connection.connected = false;
				_this2.emit('disconnect');
			},
			/**
    * Destroy the socket on error
    */
			error: function error() {
				_this2.log(_gulpUtil2['default'].colors.yellow('Socket error'));
				_this2._connection.destroy();
			},
			/**
    * Sends a handshake on connect.
    */
			connect: function connect() {
				_this2.log('Connected');
				_this2._connection.send({ id: 'gulp#' + _config2['default'].get('pluginID') }); // Send handshake
				_this2._connection.connected = true;
				_this2.emit('connect');

				if (typeof onConnect === 'function') {
					onConnect.call(_this2);
					onConnect = null;
				}
			},
			/**
    * Handle when data is received
    */
			data: function data(_data) {
				var received = undefined;

				try {
					received = JSON.parse(_data.toString());
				} catch (err) {
					_this2.log('Error parsing socket data:', err);
				}

				_this2.emit('receive', received);
			}
		};

		if (!connected && !connecting) {
			this._connection = (0, _utils.createSocket)({
				host: 'localhost',
				port: this.settings.get('port'),
				events: socketEventHandlers
			});
			this._connection.connected = false;
		}

		return this;
	},

	/**
  * Disconnect the socket from the server.
  * @param  {Function} onDisconnect
  * @return {void}
  */
	disconnect: function disconnect(onDisconnect) {
		var _this3 = this;

		var socket = this._connection;
		var listenerWrapper = function listenerWrapper() {
			if (typeof onDisconnect === 'function') {
				onDisconnect.call(_this3);
				onDisconnect = null;
			}

			socket.removeListener('close', listenerWrapper);
		};

		this.emit('disconnect:before');
		this._remainDisconnected = true;

		if (this._connection) {
			this._connection.on('close', listenerWrapper);
			this._connection.destroy();
		}

		return this;
	},

	config: function config() {
		var options = arguments[0] === undefined ? {} : arguments[0];
		var gulp = options.gulp;

		this.settings.set(options);

		if (_util2['default'].isObject(gulp)) {
			gulp.removeListener('task_start', this.onGulpTaskStart);
			gulp.on('task_start', this.onGulpTaskStart);
		}

		return this;
	},

	/**
  * Send a command to the server.
  * @param  {Object} command
  * @return {void}
  */
	run: function run(command) {
		var connected = this._connection !== null && this._connection.connected ? true : false;
		var args_id = command.data.args.id;
		this.emit('run:before', (0, _objectAssign2['default'])({}, command));

		if (!connected) {
			return;
		}

		// Since the IDs are usually used to identify the regions, icons, etc,
		// IDs are prefixed with the id of the plugin to avoid collisions with
		// with other gulp files running.
		if (typeof args_id === 'string') {
			command.data.args.id = args_id + '#' + _config2['default'].get('pluginID');
		}

		this._connection.send(command);
		this.emit('run', (0, _objectAssign2['default'])({}, command));

		return this;
	},

	/**
  * Set a status message in Sublime
  * @param  {String} id     The id of the status message
  * @param  {String} status The message that will be shown
  * @return {void}
  */
	setStatus: function setStatus(id, status) {
		var args = { id: id, status: status };
		var init_args = { views: '<all>' };
		var command = (0, _utils.Command)({ name: 'set_status', args: args, init_args: init_args });
		this.run(command);

		return this;
	},

	/**
  * Erase a status message in Sublime Text's status bar
  * @param  {String} id The id of the status message
  */
	eraseStatus: function eraseStatus(id) {
		var args = { id: id };
		var init_args = { views: '<all>' };
		var command = (0, _utils.Command)({ name: 'erase_status', args: args, init_args: init_args });
		this.run(command);

		return this;
	},

	/**
  * Hide the gutters, highlighted text lines, and error status messages
  * @param  {String} id The id of the status message to erase
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
		this.run(command);

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
  * The base data needed in the error object is a file name and line number
  *
  * @param  {String} id   The id to associate with the status message
  * @param  {Error}  err  The gulp error object
  * @return {void}
  */
	showError: function showError(err, id) {
		if (typeof id !== 'string') {
			var _err = new Error('The ID passed is not of type String');
			throw _err;
		}

		var error = (0, _utils.normalizeError)(err, id);
		var args = { id: id, error: error };
		var init_args = { views: [error.file] };
		var command = (0, _utils.Command)({ name: 'show_error', args: args, init_args: init_args });
		this.run(command);

		return this;
	},

	/**
  * Removes the errors associated with the task each time
  * the task starts.
  * @param  {Object} task
  * @return {void}
  */
	onGulpTaskStart: function onGulpTaskStart(task) {
		this.eraseErrors(task.task);
	}
};

// Turn sublime into an event emitter
(0, _objectAssign2['default'])(SublimeProto, _events.EventEmitter.prototype);

/**
 * Creates a sublime object
 * @return {Object}
 */
function Sublime() {
	var options = arguments[0] === undefined ? {} : arguments[0];

	var result = Object.create(SublimeProto);

	var settings = (0, _settings2['default'])({
		defaults: defaultSettings,
		validations: {
			deferConnect: _util2['default'].isBoolean,
			disableLogging: _util2['default'].isBoolean,
			automaticReconnect: _util2['default'].isBoolean,
			reconnectTimeout: Number.isFinite,
			port: Number.isFinite,
			maxTries: Number.isFinite
		}
	});

	settings.set((0, _objectAssign2['default'])({}, options));
	settings.on('change', onSettingsChange);

	_events.EventEmitter.call(result);

	result.on('connect', onSublimeConnect);
	result.on('disconnect', onSublimeDisconnect);
	result.on('receive', onDataReceived);

	result.onGulpTaskStart = result.onGulpTaskStart.bind(result);
	result.settings = settings;
	result.log = (0, _utils.logger)(_config2['default'].get('pluginName'), settings);

	Object.defineProperty(result, 'constructor', { value: Sublime });

	return result;
}

Sublime.prototype = SublimeProto;

function onSettingsChange(data) {
	var validations = data.validations;
	var failedValidationNames = Object.keys(validations).filter(function (name) {
		return validations[name] === false;
	}).map(function (name) {
		return '\'' + name + '\'';
	});

	if (failedValidationNames.length) {
		console.log('Invalid settings were specified for', failedValidationNames.join(', '));
	}
}

/**
 * Reset the reconnection tries
 * @return {void}
 */
function onSublimeConnect() {
	this._reconnectTries = 0;
}

/**
 * Determine whether or not to reconnect
 * @return {void}
 */
function onSublimeDisconnect() {
	var automaticReconnect = this.settings.get('automaticReconnect');

	if (automaticReconnect && !this._remainDisconnected) {
		this._reconnect();
	}
}

var receiveLogger = (0, _utils.logger)('Sublime');

function onDataReceived(data) {
	if (!this.settings.get('disableLogging')) {
		receiveLogger(data);
	}

	if (data.handshake) {
		this._connection.shaken = true;;
	}
}

var sublime = Sublime();

/**
 * Determine whether or not to defer connecting
 */
setTimeout(function () {
	if (sublime.settings.get('deferConnect') === false) {
		sublime.connect();
	}
}, 100);

exports['default'] = sublime;
module.exports = exports['default'];