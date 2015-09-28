'use strict';

import { Command, normalizeError, createSocket, createUID, logger } from './utils';
import Settings from './settings';
import pluginConfig from './config';
import assign from 'object-assign';
import gutil from 'gulp-util';
import { EventEmitter } from 'events';
import util from 'util';




/**
 * Default configuration options for a sublime object
 * @return {Object}
 */
const defaultSettings = (function () {
	/**
	 * Whether or not to connect with the module is required
	 * @type {Boolean}
	 */
	const deferConnect = false;

	/**
	 * The maximum number of times the socket will try to
	 * reconnect to the server.
	 * @type {Number}
	 */
	const maxTries = 30;

	/**
	 * The default port to connect to the server.
	 * @type {Number}
	 */
	const port = 30048;

	/**
	 * The timeout before the next reconnect occurs.
	 * @type {Number}
	 */
	const reconnectTimeout = 2000;

	/**
	 * Whether or not to automatically reconnect after disconnecting.
	 * Note: Calling .disconnect() will cause the socket to remain
	 * disconnected, even if this option is set to true.
	 * @type {Boolean}
	 */
	const automaticReconnect = true;

	/**
	 * When true, messages will be logged to the console.
	 * @type {Boolean}
	 */
	const disableLogging = false;

	return Object.freeze({
		automaticReconnect,
		disableLogging,
		deferConnect,
		maxTries,
		port,
		reconnectTimeout,
	});
}());




const SublimeProto = {
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
		this._reconnectTries++;

		if (this._reconnectTries > this.settings.get('maxTries')) {
			this.log('Max reconnect tries exceeded');
			return;
		}

		setTimeout(() => {
			this.connect();
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
		// Are we still trying to connect from the previous .connect() call?
		const connecting = (this._connection !== null && this._connection._connecting) ? true : false;
		const connected = (this._connection !== null && this._connection.connected) ? true : false;

		this.emit('connect:before');
		this._remainDisconnected = false;

		/**
		 * Handlers for the socket events.
		 * @type {Object}
		 */
		const socketEventHandlers = {
			/**
			 * Handle socket close event.
			 */
			close: () => {
				this.log('Disconnected');
				this._connection.connected = false;
				this.emit('disconnect');
			},
			/**
			 * Destroy the socket on error
			 */
			error: () => {
				this.log(gutil.colors.yellow('Socket error'));
				this._connection.destroy();
			},
			/**
			 * Sends a handshake on connect.
			 */
			connect: () => {
				this.log('Connected');
				this._connection.send({ id: `gulp#${pluginConfig.get('pluginID')}` }); // Send handshake
				this._connection.connected = true;
				this.emit('connect');

				if (typeof onConnect === 'function') {
					onConnect.call(this);
					onConnect = null;
				}
			},
			/**
			 * Handle when data is received
			 */
			data: (data) => {
				let received;

				try {
					received = JSON.parse(data.toString());
				} catch (err) {
					this.log('Error parsing socket data:', err);
				}

				this.emit('receive', received);
			}
		};

		if ( ! connected && ! connecting) {
			this._connection = createSocket({
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
		const socket = this._connection;
		const listenerWrapper = () => {
			if (typeof onDisconnect === 'function') {
				onDisconnect.call(this);
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

	config: function (options={}) {
		const { gulp } = options;
		this.settings.set(options);

		if (util.isObject(gulp)) {
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
		const connected = (this._connection !== null && this._connection.connected) ? true : false;
		const args_id = command.data.args.id;
		this.emit('run:before', assign({}, command));

		if ( ! connected) {
			return;
		}

		// Since the IDs are usually used to identify the regions, icons, etc,
		// IDs are prefixed with the id of the plugin to avoid collisions with
		// with other gulp files running.
		if (typeof args_id === 'string') {
			command.data.args.id = `${args_id}#${pluginConfig.get('pluginID')}`;
		}

		this._connection.send(command);
		this.emit('run', assign({}, command));

		return this;
	},

	/**
	 * Set a status message in Sublime
	 * @param  {String} id     The id of the status message
	 * @param  {String} status The message that will be shown
	 * @return {void}
	 */
	setStatus: function setStatus(id, status) {
		const args = { id, status };
		const init_args = { views: '<all>' };
		const command = Command({ name: 'set_status', args, init_args });
		this.run(command);

		return this;
	},

	/**
	 * Erase a status message in Sublime Text's status bar
	 * @param  {String} id The id of the status message
	 */
	eraseStatus: function eraseStatus(id) {
		const args = { id };
		const init_args = { views: '<all>' };
		const command = Command({ name: 'erase_status', args, init_args });
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
			let err = new Error('The ID passed is not of type String');
			throw err;
		}

		const args = { id };
		const init_args = { views: '<all>' };
		const command = Command({ name: 'erase_errors', args, init_args });
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
			let err = new Error('The ID passed is not of type String');
			throw err;
		}

		const error = normalizeError(err, id);
		const args = { id, error };
		const init_args = { views: [error.file] };
		const command = Command({ name: 'show_error', args, init_args });
		this.run(command);

		return this;
	},

	/**
	 * Removes the errors associated with the task each time
	 * the task starts.
	 * @param  {Object} task
	 * @return {void}
	 */
	onGulpTaskStart: function (task) {
		this.eraseErrors(task.task);
	},
};

// Turn sublime into an event emitter
assign(SublimeProto, EventEmitter.prototype);




/**
 * Creates a sublime object
 * @return {Object}
 */
function Sublime(options={}) {
	const result = Object.create(SublimeProto);

	const settings = Settings({
		defaults: defaultSettings,
		validations: {
			deferConnect: util.isBoolean,
			disableLogging: util.isBoolean,
			automaticReconnect: util.isBoolean,
			reconnectTimeout: Number.isFinite,
			port: Number.isFinite,
			maxTries: Number.isFinite,
		},
	});

	settings.set(assign({}, options));
	settings.on('change', onSettingsChange);

	EventEmitter.call(result);

	result.on('connect', onSublimeConnect);
	result.on('disconnect', onSublimeDisconnect);
	result.on('receive', onDataReceived);

	result.onGulpTaskStart = result.onGulpTaskStart.bind(result);
	result.settings = settings;
	result.log = logger(pluginConfig.get('pluginName'), settings);

	Object.defineProperty(result, 'constructor', { value: Sublime });


	return result;
}

Sublime.prototype = SublimeProto;




function onSettingsChange(data) {
	var validations = data.validations;
	var failedValidationNames = Object.keys(validations)
		.filter(name => validations[name] === false)
		.map(name => "'" + name + "'" )

	if (failedValidationNames.length) {
		console.log('Invalid settings were specified for', failedValidationNames.join(', '))
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
	const automaticReconnect = this.settings.get('automaticReconnect');

	if (automaticReconnect && ! this._remainDisconnected) {
		this._reconnect();
	}
}

const receiveLogger = logger('Sublime');

function onDataReceived(data) {
	if ( ! this.settings.get('disableLogging')) {
		receiveLogger(data);
	}

	if (data.handshake) {
		this._connection.shaken = true;;
	}
}




const sublime = Sublime();

/**
 * Determine whether or not to defer connecting
 */
setTimeout(function () {
	if (sublime.settings.get('deferConnect') === false) {
		sublime.connect();
	}
}, 100);

export default sublime;