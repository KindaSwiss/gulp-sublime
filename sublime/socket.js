'use strict';

var net = require('net');
var utils = require('./utils')



var END_OF_MESSAGE = '\n';




function socket_send(data) {
	return this.write(JSON.stringify(data) + END_OF_MESSAGE);
};




/**
 * A factory for creating sockets 
 * @param {Object}   options 
 * @param {Function} onConnectHandler 
 */
function createSocket(options, onConnectHandler) {
	if (typeof options !== 'object') {
		throw new Error('Socket options were not specified');
	}

	var port = Number(options.port);

	if ( ! utils.isNumber(port)) {
		throw new Error('The port specified is invalid: ' + port);
	}

	var socket = net.createConnection(port, 'localhost');
	socket.setEncoding('utf8');

	// Add event handlers to the socket 
	if (typeof options.on === 'object') {
		for (var eventName in options.on) {
			if ( ! options.on.hasOwnProperty(eventName)) { continue; }
			var eventHandler = options.on[eventName];
			socket.on(eventName, eventHandler);
		}
	}

	// Add the fn, which is the on connect handler 
	if (typeof onConnectHandler === 'function') {
		socket.on('connect', onConnectHandler);
	}

	socket.send = socket_send;

	return socket;
};


module.exports.createSocket = createSocket;






