'use strict';



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
 * Used to prefix the task names so that there are no collisions
 * with other gulpfiles running. 
 * @type {String}
 */
const PLUGIN_ID = (function () {
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
}());

let dev = false;
let port = PORT;

export default { dev, port, PLUGIN_ID, PLUGIN_NAME, PORT, RECONNECT_TIMEOUT, MAX_TRIES };



