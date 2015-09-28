'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _events = require('events');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

/**
 * The end of message
 * @type {String}
 */
var END_OF_MESSAGE = '\n';

function socketsend(data) {
	var message = JSON.stringify(data);
	return this.write(message + END_OF_MESSAGE);
};

/**
 * Creates and returns a socket
 * @param  {Object} options
 * @return {Object}
 */
function createSocket(options) {
	var port = options.port;
	var events = options.events;

	if (!Number.isFinite(port)) {
		var err = new Error('The port specified is invalid: ' + port);
		throw err;
	}

	var socket = _net2['default'].createConnection(port, 'localhost');
	socket.setEncoding('utf8');
	socket.send = socketsend;
	socket.id = uniqueId();

	// Add event handlers to the socket
	if (typeof events === 'object') {
		for (var eventName in events) {
			var eventHandler = events[eventName];
			socket.on(eventName, eventHandler);
		}
	}

	return socket;
};

/**
 * Normalizes an error object's line, column, file
 * properties and adds some others.
 * @param  {Error}  err
 * @param  {String} id
 * @return {Object}
 */
function normalizeError(err, id) {
	var pluginName = err.plugin || id;
	var loc = err.loc;

	var line = err.line || err.lineNumber;
	var column = err.column || err.col;
	var file = err.file || err.fileName;
	var message = err.message;

	// Babeljs, why you do dis??
	if (loc && typeof loc === 'object') {
		line = loc.line;
		column = loc.column;
	}

	line = typeof line === 'number' ? line : null;
	column = typeof column === 'number' ? column : null;

	// Just in case any error message (such as autoprefixer) produce an
	// extremely long error message
	if (message && message.length > 2000) {
		message = message.substring(0, 2000);
	}

	// Fix the case where the error occurred in gulp-sass and the file
	// being processed is an entry file
	if (file === 'stdin' && pluginName === 'gulp-sass') {
		file = err.message.split('\n')[0];
	}

	var basename = _path2['default'].basename(file);
	var dirname = _path2['default'].dirname(file);
	var ext = _path2['default'].extname(file);
	var rootName = _path2['default'].basename(file, ext);

	var error = {
		plugin_name: pluginName,
		file_path: dirname, // The directory path (excludes the basename)
		file_name: basename, // The root name of the file with the extension
		file_base_name: rootName, // The root name of the file (without the extension)
		file_extension: ext, // The file extension
		file: file, // The absolute file path
		line: line,
		column: column,
		message: message };

	return error;
};

/**
 * Packages up command information into one object
 * @param  {Object} options
 * @param  {String} options.name
 * @param  {Object} options.args
 * @param  {Object} options.init_args
 * @return {Object}
 */
function Command(options) {
	if (!options || typeof options !== 'object') {
		var err = new Error('Invalid parameters passed for Command');
		throw err;
	}

	var name = options.name;
	var _options$args = options.args;
	var args = _options$args === undefined ? {} : _options$args;
	var _options$init_args = options.init_args;
	var init_args = _options$init_args === undefined ? {} : _options$init_args;

	return {
		name: name,
		data: {
			args: args,
			init_args: init_args
		},
		uid: uniqueId()
	};
};

/**
 * Return a simple unique id.
 * @return {Number}
 */
var uniqueId = (function () {
	var id = 0;

	return function uniqueId() {
		return id++;
	};
})();

/**
 * Creates a uid
 * @return {String}
 */
function createUID() {
	var i, random;
	var uuid = '';

	for (i = 0; i < 32; i++) {
		random = Math.random() * 16 | 0;
		if (i === 8 || i === 12 || i === 16 || i === 20) {
			uuid += '-';
		}
		uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16);
	}

	return uuid;
};

/**
 * Returns a function that logs the data passed to the console.
 * The log is prefixed with the specified name.
 * @param  {String} name
 * @return {void}
 */
function logger(name, settings) {
	return function log() {
		if (_util2['default'].isObject(settings) && settings.get('disableLogging')) {
			return;
		}

		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		args.unshift(_gulpUtil2['default'].colors.white('[') + _gulpUtil2['default'].colors.cyan(name) + _gulpUtil2['default'].colors.white(']'));
		console.log.apply(console, args);
	};
}

exports['default'] = {
	Command: Command,
	createSocket: createSocket,
	normalizeError: normalizeError,
	uniqueId: uniqueId,
	createUID: createUID,
	logger: logger
};
module.exports = exports['default'];
// The error message the plugin gave