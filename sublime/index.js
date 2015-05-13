'use strict';

var util = require('util');
var path = require('path');

var utils = require('./utils');
var createSocket = require('./socket').createSocket;


/**
 * The port to connect to Sublime Text
 * @type {Number}
 */
var PORT = 30048;


/**
 * The maximum number of times the socket will try to reconnect to sublime 
 * @type {Number}
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
		var data = json.loads(data.toString());
	}
}


/**
 * Whether or not the socket is connected
 * @type {Boolean}
 */
var connected = false;


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
	 * 
	 * @param {Object} options
	 * @param {Funtion} onConnectHandler
	 */
	connect: function (options, onConnectHandler) {
		var port = typeof options === 'object' && utils.isNumber(options.port) ? options.port : PORT;
		
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
	config: function (gulp) {
		gulp.on('task_start', function (task) {
			if (task.task === 'default') { return; }
			sublime.erase_errors(task.task);
		});
	},
	/**
	 * Set a status message in Sublime 
	 * @param {String} id     The id of the status message
	 * @param {String} status The message that will be shown 
	 */
	set_status: function(id, status) {
		this._connection.send({
			command_name: 'set_status', 
			data: { id: id,
			 		status: status }
		});
	},
	/**
	 * Erase a status message in Sublime Text's status bar 
	 * @param  {String} id The id of the status message
	 */
	erase_status: function (id) {
		this._connection.send({
			command_name: 'erase_status',
			data: {
				status_id: id
			}
		})
	},
	/**
	 * Run a Sublime Text command 
	 * @param  {String} command_name
	 * @param  {Object} args
	 */
	run_command: function (command_name, args) {
		// sublime._connection.send({
		// 	command: command_name,
		// 	args: args
		// });
	},
	/**
	 * Run a gulp command in Sublime Text
	 * @param  {String} command_name
	 * @param  {Object} args
	 */
	run: function (command_name, args) {
		if ( ! utils.isObject(args)) {
			throw new Error('Args must be an object');
		}
		sublime._connection.send({
			command_name: command_name,
			data: args || {}
		});
	},
	/**
	 * Hide the gutters, highlighted text lines, and error status messages
	 *
	 * @param  {String} id  The id of the status message to erase 
	 */
	erase_errors: function (id) {
		if ( ! utils.isString(id)) {
			throw new Error('ID must be of type String');
		}
		return sublime.run('erase_errors', { id: id });
	},
	/**
	 * Shows an error in Sublime Text's status bar. 
	 * 
	 * If only an id is passed, show_error will return a function that will set an error status 
	 * message in Sublime's status bar. The returned function is meant to be used as a direct 
	 * error handler and will emit an "end" event so that gulp.watch doesn't stop. 
	 * 
	 * If an id and error is passed, it will show the error in Sublime's status bar and will 
	 * return the error status message. Using show_error in this way does not trigger an 
	 * "end" event. To manually trigger the "end" event, use the "done" callback that is passed 
	 * to each task.
	 * 
	 * @param  {String} id   The id to associate with the status message
	 * @param  {Error}  err
	 * @return {String|Function}
	 */
	show_error: function show_error(id, err) {

		if (typeof id !== 'string') {
			throw new Error('The id provided is not of type String')
		}

		var errorHandler = function(err) {
			if (typeof this=== 'object' && typeof this.emit === 'function') {
				// Emit 'end' so gulp.watch doesn't stop 
				this.emit('end');
			}

			var line = (err.line || err.lineNumber) - 1;

			// Use the plugin name (provided by plumber) or the id, 
			// if the plugin name does not exist use the id 
			var pluginName = err.plugin || id;

			var file = err.file || err.fileName;

			var basename = path.basename(file);
			var dirname = path.dirname(file);
			var ext = path.extname(file);
			var rootName = path.basename(file, ext);

			var error = {
				plugin_name: pluginName,
				
				// The directory path (excludes the basename)
				file_path: dirname,
				file_dir: dirname,
				
				// The root name of the file with the extension 
				file_name: basename,
				basename: basename,

				// The root name of the file (without the extension)
				file_base_name: rootName,
				root_name: rootName,
				
				// The file extension 
				file_extension: ext,
				file_ext: ext,

				// The full file path 
				file: file,
				
				line: line,
				message: err.message.split(/\n/)[0],
			};
			
			
			sublime.run('set_error_status', {
				id: id,
				error: error
			});

			sublime.run('show_popup', {
				file_name: file, 
				line: line,
				error: error
			});

			sublime.run('highlight_text_line', {
				id: id,
				file_name: file, 
				line: line });
			
			sublime.run('gutter_line', { 
				id: id, file_name: file, line: line });
			
		}

		if (typeof err === 'object') {
			return errorHandler(err);
		}

		errorHandler.id = id;
		
		return errorHandler;
	},
};

module.exports = sublime;





