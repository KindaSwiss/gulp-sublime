
import * as path from 'path';
import * as net from 'net';
import config from './config';



/**
 * The end of message
 * @type {String}
 */
const END_OF_MESSAGE = '\n';

const socket_send = function socket_send(data) {
	var message = JSON.stringify(data);
	return this.write(message + END_OF_MESSAGE);
};

/**
 * Creates and returns a socket
 *
 * @param {Object}   options
 * @return {Object}
 */
const createSocket = function createSocket(options) {
	const port = options.port;

	if ( ! Number.isFinite(port)) {
		let err = new Error('The port specified is invalid: ' + port);
		throw err;
	}

	const socket = net.createConnection(port, 'localhost');
	socket.setEncoding('utf8');
	socket.send = socket_send;

	// Add event handlers to the socket
	if (typeof options.on === 'object') {
		for (let eventName in options.on) {
			if ( ! options.on.hasOwnProperty(eventName)) {
				continue;
			}

			const eventHandler = options.on[eventName];
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
const normalizeError = function normalizeError(err, id) {
	const pluginName = err.plugin || id;
	const { loc } = err;

	let line = (err.line || err.lineNumber);
	let column = err.column;

	// Babeljs, why you do dis??
	if (loc && typeof loc === 'object') {
		line = loc.line;
		column = loc.column;
	}

	line   = (typeof line === 'number')   ? line : null;
	column = (typeof column === 'number') ? column : null;

	let file = err.file || err.fileName;
	let message = err.message;

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

	const basename = path.basename(file);
	const dirname = path.dirname(file);
	const ext = path.extname(file);
	const rootName = path.basename(file, ext);

	const error = {
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
		file,

		line,
		column,

		message,

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
const Command = function Command(options) {


	if (typeof options !== 'object') {
		let err = new Error('Invalid parameters passed for Command');
		throw err;
	}

	const { name, args={}, init_args={}, uid=uniqueId() } = options;

	return {
		name: name,
		data: {
			args,
			init_args
		},
		uid
	};
};


/**
 * Log things to the console
 * @return {void}
 */
const log = function log() {
	if ( ! config.dev) {
		return;
	}

	console.log.apply(console, arguments);
};


/**
 * Return a simple unique id
 * @return {Number}
 */
const uniqueId = (function () {
	let id = 0;
	return function uniqueId() {
		return id++;
	};
}());


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
const where = function where(collection, names, value) {
	names = names.split('.');

	const items = collection;
	const length = items.length;
	const matches = [];
	let i = 0;

	for (; i < length; i++) {
		let item = items[i];
		let comparator = item;
		let j = 0;

		while (comparator !== undefined && comparator !== null) {
			// With every while loop, comparator will equal the next property
			let propertyName = names[j];
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




export default { normalizeError, Command, log, uniqueId, createSocket, where };



