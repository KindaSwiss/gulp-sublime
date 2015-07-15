'use strict';
/* globals sublime */


import { where, Command, normalizeError, createSocket, uniqueId, log } from './utils';
import { EventEmitter } from 'events';
import mapStream from 'map-stream';
import assign from 'object-assign';
import gutil from 'gulp-util';
import config from './config';




const { PLUGIN_ID, PLUGIN_NAME, PORT, RECONNECT_TIMEOUT, MAX_TRIES } = config;

/**
 * Fires when a file changes. The file that initiated the 
 * changes are stored in `taskInitiatior`. 
 * @param  {Event} event 
 * @return {void}       
 */
const onWatchChange = function (event) {
	taskInitiator = event.path;
};

/**
 * Sets the current task and resets the command queue. 
 * @param  {Object} task 
 * @return {void}        
 */
const onGulpTaskStart = function onGulpTaskStart(task) {
	if (task.task === 'default') { return; }
	currentTask = task.task;
	sublime.eraseErrors(task.task);
	commandQueue = [];
};

/**
 * Runs the commands in the queue. 
 * @param  {Object} task 
 * @return {void}        
 */
const onGulpTaskStop = function onGulpTaskStop(task) {
	commandQueue.forEach(function (command) {
		sublime.run(command);
	});
};

/**
 * Handlers for the socket events. 
 * @type {Object}
 */
const socketEventHandlers = {
	/**
	 * Handle sublime._connection socket close event.
	 *
	 */
	close: function onSocketClosed () {
		log('Connection closed');
		sublime.emit('disconnect');
	},
	/**
	 * Destroy the socket on error 
	 */
	error: function onSocketError () {
		log('Socket error');
		this.destroy();
	},
	/**
	 * Connect to Sublime Text's server 
	 */
	connect: function onSocketConnected () {
		log('Connected to server');
		
		const id = "gulp#" + PLUGIN_ID;
		const handshake = { id };
		this.send(handshake);

		sublime.emit('connect');
	},
	/**
	 * Handle when data is received 
	 */
	data: function onSocketReceived(data) {
		// const received = JSON.parse(data.toString());
	}
};

/**
 * A list of commands to run after a task has been finished. 
 *
 * Basically a way to accumulate data for all files for a single 
 * command. The commands are sent when a task finishes and resets when any task starts.
 *
 * The commands are sent when a task finishes and is reset 
 * when a task is run. 
 * 
 * @type {Array.<Command>}
 */
let commandQueue = [];

/**
 * Whether or not the socket is connected. 
 * @type {Boolean}
 */
let connected = false;

/**
 * The name of the current task being run. 
 * @type {String}
 */
let currentTask = null;

/**
 * The name of the file that initiated a task via watch. 
 * @type {String}
 */
let taskInitiator = '';

/**
 * The number of times we have tried to reconnect. 
 * @type {Number}
 */
let reconnectTries = 0;

/**
 * Whether or not to reconnect to Sublime Text after 
 * the socket is closed. 
 * @type {Boolean}
 */
let shouldReconnect = true;




const SublimeProto = {
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
		reconnectTries++;
		log('Reconnecting, attempt %s', reconnectTries);

		if (reconnectTries > MAX_TRIES) {
			return log('Max reconnect tries exceeded');
		}

		setTimeout(() => {
			this.connect();
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
			this._connection = createSocket({
				host: 'localhost',
				port: config.port,
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
	disconnect: function disconnect(onDisconnect, reconnectAfterDisconnect = true) {
		this.emit('disconnect:before');

		const socket = this._connection;

		// Adds a temporary listener 
		const listenerWrapper = () => {
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
	
	config: function (options) {
		if (Number.isFinite(options.port)) {
			config.port = options.port;
		}

		if (options.gulp !== undefined) {
			config.gulp = options.gulp;
		}

		config.dev = !! options.dev;
		
		sublime.connect();
	},

	/**
	 * Run a gulp command in Sublime Text. 
	 * 
	 * @param  {Object} command 
	 * @return {void}
	 */
	run: function run(command) {
		this.emit('run:before');

		const args_id = command.data.args.id;
		if (typeof args_id === 'string') {
			command.data.args.id = args_id + '#' + config.PLUGIN_ID;
		}

		command.data.args.task_initiator = taskInitiator;
		sublime._connection.send(command);

		this.emit('run');

		return this;
	},

	/**
	 * Used for setting the name of the file that initiated 
	 * the task. 
	 * @param  {Array} watchers 
	 * @return {void}           
	 */
	watchers: function watchers(watchers) {
		watchers.forEach(function (watcher) {
			watcher.removeListener('change', onWatchChange);
			watcher.on('change', onWatchChange);
		});

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
		const args = { id, status };
		const init_args = { views: '<all>' };
		const command = Command({ name: 'set_status', args, init_args });
		sublime.run(command);

		return this;
	},

	/**
	 * Erase a status message in Sublime Text's status bar 
	 * 
	 * @param  {String} id The id of the status message
	 */
	eraseStatus: function eraseStatus(id) {
		const args = { id };
		const init_args = { views: '<all>' };
		const command = Command({ name: 'erase_status', args, init_args });
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
			let err = new Error('The ID passed is not of type String');
			throw err;
		}

		const args = { id };
		const init_args = { views: '<all>' };
		const command = Command({ name: 'erase_errors', args, init_args });
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
	showError: function showError(error, id=currentTask) {
		if (typeof id !== 'string') {
			let err = new Error('The ID passed is not of type String');
			throw err;
		}
		
		error = normalizeError(error, id);

		const args = { id, error };
		const init_args = { views: [error.file] };
		const command = Command({ name: 'show_error', args, init_args });
		sublime.run(command);

		return this;
	},

	/**
	 * A JSHint reporter 
	 * 
	 * @param  {String} id
	 * @return {map-stream}
	 */
	reporter: function reporter(id=currentTask) {
		const uid = uniqueId();

		return mapStream(function (file, cb) {

			const report = file.jshint;
			
			// Find the command to add more data to it 
			// The command will be run when the task ends 
			let command = where(commandQueue, 'uid', uid).shift();
			
			// Create the command and add it to the queue if 
			// it doesn't already exist 
			if ( ! command) {
				const args = { reports: [report], id };
				command = Command({ name: 'report', args, uid });
				commandQueue.push(command);
			}

			command.data.args.reports.push(report);

			return cb(null, file);
		});
	}
};




// Turn `sublime` into an event emitter 
assign(SublimeProto, EventEmitter.prototype);
const sublime = Object.create(SublimeProto);
EventEmitter.call(sublime);




sublime.on('connect', function onSublimeConnect() {
	const gulp = config.gulp;

	if (typeof gulp === 'object') {
		gulp.removeListener('task_start', onGulpTaskStart);
		gulp.removeListener('task_stop', onGulpTaskStop);
		gulp.on('task_start', onGulpTaskStart);
		gulp.on('task_stop', onGulpTaskStop);
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








export default sublime;



