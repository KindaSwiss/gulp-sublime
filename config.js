'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var PLUGIN_NAME = 'gulp-sublime';

/**
 * The maximum number of times the socket will try to
 * reconnect to Sublime Text.
 * @type {Number}
 */
var MAX_TRIES = 10;

/**
 * The default port to connect to Sublime Text.
 * @type {Number}
 */
var PORT = 30048;

/**
 * The timeout before the next reconnect
 * @type {Number}
 */
var RECONNECT_TIMEOUT = 2000;

/**
 * Used to prefix the task names so that there are no collisions
 * with other gulpfiles running.
 * @type {String}
 */
var PLUGIN_ID = (function () {
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
})();

var dev = false;
var port = PORT;

exports['default'] = { dev: dev, port: port, PLUGIN_ID: PLUGIN_ID, PLUGIN_NAME: PLUGIN_NAME, PORT: PORT, RECONNECT_TIMEOUT: RECONNECT_TIMEOUT, MAX_TRIES: MAX_TRIES };
module.exports = exports['default'];