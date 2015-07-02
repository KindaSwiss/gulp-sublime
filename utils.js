'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _net = require('net');

var net = _interopRequireWildcard(_net);

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

	// Fix the case where the file being processed by gulp-sass
	// isn't an imported partial
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
 * 
 * @param  {String} command_name
 * @param  {Object} args         
 * @param  {Object} init_args    
 * @return {Object} 
 */
var makeCommand = function makeCommand(command_name, args, init_args) {
	return {
		command_name: command_name,
		data: {
			args: args || {},
			init_args: init_args
		}
	};
};

/**
 * Log things to the console 
 * @return {void} 
 */
var log = function log() {
	if (!log.dev) {
		return;
	}

	console.log.apply(console, arguments);
};

/**
 * Return a simple unique id 
 * @return {Number} 
 */
var uniqueId = function uniqueId() {
	var id = 0;
	return function uniqueId() {
		return id++;
	};
};

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

exports.normalizeError = normalizeError;
exports.makeCommand = makeCommand;
exports.log = log;
exports.uniqueId = uniqueId;
exports.createSocket = createSocket;
exports.where = where;