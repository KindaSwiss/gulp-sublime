'use strict';

import assign from 'object-assign';
import gutil from 'gulp-util';
import { EventEmitter } from 'events';
import util from 'util';
import path from 'path';
import net from 'net';




/**
 * The end of message
 * @type {String}
 */
const END_OF_MESSAGE = '\n';

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
	const { port, events } = options;

	if ( ! Number.isFinite(port)) {
		let err = new Error('The port specified is invalid: ' + port);
		throw err;
	}

	const socket = net.createConnection(port, 'localhost');
	socket.setEncoding('utf8');
	socket.send = socketsend;
	socket.id = uniqueId();

	// Add event handlers to the socket
	if (typeof events === 'object') {
		for (let eventName in events) {
			const eventHandler = events[eventName];
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
	const pluginName = err.plugin || id;
	const { loc } = err;

	let line = (err.line || err.lineNumber);
	let column = (err.column || err.col);
	let file = err.file || err.fileName;
	let message = err.message;

	// Babeljs, why you do dis??
	if (loc && typeof loc === 'object') {
		line = loc.line;
		column = loc.column;
	}

	line   = (typeof line === 'number')   ? line : null;
	column = (typeof column === 'number') ? column : null;

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

	const basename = path.basename(file);
	const dirname  = path.dirname(file);
	const ext      = path.extname(file);
	const rootName = path.basename(file, ext);

	const error = {
		plugin_name: pluginName,
		file_path: dirname,       // The directory path (excludes the basename)
		file_name: basename,      // The root name of the file with the extension
		file_base_name: rootName, // The root name of the file (without the extension)
		file_extension: ext,      // The file extension
		file,                     // The absolute file path
		line,
		column,
		message,                  // The error message the plugin gave
	};

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
	if ( ! options || typeof options !== 'object') {
		let err = new Error('Invalid parameters passed for Command');
		throw err;
	}

	const {
		name,
		args={},
		init_args={},
	} = options;

	return {
		name,
		data: {
			args,
			init_args
		},
		uid: uniqueId()
	};
};

/**
 * Return a simple unique id.
 * @return {Number}
 */
const uniqueId = (function () {
	let id = 0;

	return function uniqueId() {
		return id++;
	};
}());

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
		uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
			.toString(16);
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
	return function log(...args) {
		if (util.isObject(settings) && settings.get('disableLogging')) {
			return;
		}

		args.unshift(gutil.colors.white('[') + gutil.colors.cyan(name) + gutil.colors.white(']'));
		console.log.apply(console, args);
	}
}




export default {
	Command,
	createSocket,
	normalizeError,
	uniqueId,
	createUID,
	logger
};