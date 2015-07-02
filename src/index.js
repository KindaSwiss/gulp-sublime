'use strict';
/* globals sublime */


import { where, makeCommand, normalizeError, createSocket, uniqueId, log } from './utils';
import { EventEmitter } from 'events';
import mapStream from 'map-stream';
import assign from 'object-assign';
import gutil from 'gulp-util';
import gulp from 'gulp';




const PLUGIN_NAME = 'gulp-sublime';

/**
 * The maximum number of times the socket will try to 
 * reconnect to Sublime Text. 
 * @type {Number}
 */
const MAX_TRIES = 10;

/**
 * The default port to connect to Sublime Text. 
 * @type {Number}
 */
const PORT = 30048;

/**
 * The timeout before the next reconnect 
 * @type {Number}
 */
const RECONNECT_TIMEOUT = 2000;

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
const onGulpTaskStart = function (task) {
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
const onGulpTaskStop = function (task) {
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
		
		const handshake = { "id": "gulp" };
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
 * command. When a task is run the queue is reset. The commands are sent 
 * when a task finishes.
 *
 * The commands are sent when a task finishes and is reset 
 * when a task is run. 
 * 
 * @type {Array}
 */
let commandQueue = [];

/**
 * Whether or not the socket is connected. 
 * @type {Boolean}
 */
let connected = false;

/**
 * The name of the current task being run. 
 * @type {}
 */
let currentTask = null;

/**
 * The name of the file that initiated a task via watch. 
 * @type {String}
 */
let taskInitiator = '';

/**
 * Used by utils.log to check if we should log. 
 * @type {Boolean}
 */
let dev = false;

/**
 * The port to connect to Sublime Text on.
 * @type {Number}
 */
let port = PORT;

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
	_reconnect: function () {
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
	connect: function () {
		this.emit('connect:before');

		const connect = () => {
			this._connection = createSocket({
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
	disconnect: function (onDisconnect, reconnectAfterDisconnect = true) {
		this.emit('disconnect:before');
		const socket = this._connection;

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
	},

	/**
	 * Configure settings
	 * 
	 * @param  {Object}  options
	 * @param  {Number} options.port
	 * @return {void}
	 */
	config: function (options = {}) {
		if (Number.isFinite(options.port)) {
			port = options.port;
		}

		log.dev = !! options.dev;

		// if the port is the same then don't reconnect
		if (port === PORT) {
			return;
		}

		if ('shouldReconnect' in options) {
			shouldReconnect = !! options.shouldReconnect;
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
	watchers: function (watchers) {
		watchers.forEach(function (watcher) {
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
	setStatus: function (id, status) {
		sublime.run('set_status', { id, status }, { views: '<all>' });
	},

	/**
	 * Erase a status message in Sublime Text's status bar 
	 * 
	 * @param  {String} id The id of the status message
	 */
	eraseStatus: function (id) {
		sublime.run('erase_status', { id }, { views: '<all>' });
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
	run: function (command, args, init_args) {
		this.emit('run:before');

		if (typeof command === 'string') {
			command = makeCommand(command, args, init_args);
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
	eraseErrors: function (id) {
		if (typeof id !== 'string') {
			let err = new Error('The ID passed is not of type String');
			throw err;
		}
		sublime.run('erase_errors', { id }, { views: '<all>' });
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
	showError: function(error, id = currentTask) {
		if (typeof id !== 'string') {
			let err = new Error('The ID passed is not of type String');
			throw err;
		}
		
		error = normalizeError(error, id);
		const file = error.file;
		sublime.run('show_error', { id, error }, { views: [file] });
	},

	// https://github.com/spalger/gulp-jshint/issues/50
	// Error: map stream is not writable
	/**
	 * A JSHint reporter 
	 * 
	 * @param  {String} id
	 * @return {map-stream}
	 */
	reporter: function (id = currentTask) {
		const uid = uniqueId();
		
		return mapStream(function (file, cb) {

			// Find the command to add more data to it 
			// The command will be run when the task ends 
			let command = where(commandQueue, 'uid', uid).unshift();
			
			const report = file.jshint;

			if ( ! command) {
				command = makeCommand('report', { reports: [report], id: id });
				command.uid = uid;
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
	gulp.removeListener('task_start', onGulpTaskStart);
	gulp.removeListener('task_stop', onGulpTaskStop);
	gulp.on('task_start', onGulpTaskStart);
	gulp.on('task_stop', onGulpTaskStop);

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




export default sublime;



