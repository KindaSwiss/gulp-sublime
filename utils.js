'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _net = require('net');

var net = _interopRequireWildcard(_net);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

/**
 * The end of message 
 * @type {String}
 */
var END_OF_MESSAGE = '\n';

var socket_send = function socket_send(data) {
	var message = JSON.stringify(data);
	return this.write(message + END_OF_MESSAGE);
};

/**
 * Creates and returns a socket 
 * 
 * @param {Object}   options 
 * @return {Object} 
 */
var createSocket = function createSocket(options) {
	var port = options.port;

	if (!Number.isFinite(port)) {
		var err = new Error('The port specified is invalid: ' + port);
		throw err;
	}

	var socket = net.createConnection(port, 'localhost');
	socket.setEncoding('utf8');
	socket.send = socket_send;

	// Add event handlers to the socket
	if (typeof options.on === 'object') {
		for (var eventName in options.on) {
			if (!options.on.hasOwnProperty(eventName)) {
				continue;
			}

			var eventHandler = options.on[eventName];
			socket.on(eventName, eventHandler);
		}
	}

	return socket;
};

/**
 * awd
 * @param  {Error}  err 
 * @param  {String} id  
 * @return {Object}    
 */
var normalizeError = function normalizeError(err, id) {
	var pluginName = err.plugin || id;
	var line = (err.line || err.lineNumber) - 1;
	var file = err.file || err.fileName;
	var message = err.message;

	// Just in case any error message (such as autoprefixer) produce an
	// extremely long error message
	if (message.length > 2000) {
		message = message.substring(0, 2000);
	}

	// Fix the case where the plugin errored in gulp-sass and the file
	// being processed is an entry file
	if (file === 'stdin' && pluginName === 'gulp-sass') {
		file = err.message.split('\n')[0];
	}

	var basename = path.basename(file);
	var dirname = path.dirname(file);
	var ext = path.extname(file);
	var rootName = path.basename(file, ext);

	var error = {
		plugin_name: pluginName,

		// The directory path (excludes the basename)
		file_path: dirname,

		// The root name of the file with the extension
		file_name: basename,

		// The root name of the file (without the extension)
		file_base_name: rootName,

		// The file extension
		file_extension: ext,
		file_ext: ext,

		// The absolute file path
		file: file,

		line: line,

		message: message
	};

	return error;
};

/**
 * Packages up command information into one object 
 * 
 * @param  {Object} options 
 * @param  {String} options.name
 * @param  {Object} options.args         
 * @param  {Object} options.init_args    
 * @return {Object} 
 */
var Command = function Command(options) {

	if (typeof options !== 'object') {
		var err = new Error('Invalid parameters passed for Command');
		throw err;
	}

	var name = options.name;
	var _options$args = options.args;
	var args = _options$args === undefined ? {} : _options$args;
	var _options$init_args = options.init_args;
	var init_args = _options$init_args === undefined ? {} : _options$init_args;
	var _options$uid = options.uid;
	var uid = _options$uid === undefined ? uniqueId() : _options$uid;

	return {
		name: name,
		data: {
			args: args,
			init_args: init_args
		},
		uid: uid
	};
};

/**
 * Log things to the console 
 * @return {void} 
 */
var log = function log() {
	if (!_config2['default'].dev) {
		return;
	}

	console.log.apply(console, arguments);
};

/**
 * Return a simple unique id 
 * @return {Number} 
 */
var uniqueId = (function () {
	var id = 0;
	return function uniqueId() {
		return id++;
	};
})();

/**
 * Examples:
 *
 * 		var a = [{id: 1, name: 'Max'}, {id: 2, name: 'John'}, {id: 3, name: 'John'}]; 
 * 		var results = where(a, 'name', 'John'); 
 * 		console.log(results) // [{id: 2, name: 'John'}, {id: 3, name: 'John'}] 
 *
 * @param  {Collection} collection 
 * @param  {String}     names      
 * @param  {*}          value      
 * @return {Array}            
 */
var where = function where(collection, names, value) {
	names = names.split('.');

	var items = collection;
	var length = items.length;
	var matches = [];
	var i = 0;

	for (; i < length; i++) {
		var item = items[i];
		var comparator = item;
		var j = 0;

		while (comparator !== undefined && comparator !== null) {
			// With every while loop, comparator will equal the next property
			var propertyName = names[j];
			comparator = comparator[propertyName];
			j++;

			if (comparator === value) {
				matches.push(item);
				break;
			}
		}
	}
	return matches;
};

exports['default'] = { normalizeError: normalizeError, Command: Command, log: log, uniqueId: uniqueId, createSocket: createSocket, where: where };
module.exports = exports['default'];