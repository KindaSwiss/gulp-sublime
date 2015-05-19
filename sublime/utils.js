
var path = require('path');

var isNumber = function(value) {
	value = value - 0;
	return value === value && typeof value === 'number' && isFinite(value);
};

var isString = function (value) {
	return typeof value === 'string' || Object.prototype.toString.call(value) === '[object String]';
};

var normalizeError = function (err) {
	var pluginName = err.plugin || id;
	var line = (err.line || err.lineNumber) - 1;
	var file = err.file || err.fileName;

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

		message: err.message.split(/\n/)[0],
	};
	
	return error;
};




/**
 * Check if all items are truthy 
 * @param  {Array} items
 * @return {Boolean}     Whether all items in the array are truthy 
 */
var all = function(items) {
	var index = 0, len = items.length;
	for (; index < len; index++)
	{
		if (!items[index]) { return false; }
	}
	return true;
};

/**
 * Check if all items are truthy 
 * @param  {Array} items
 * @return {Boolean}     Whether all items in the array are truthy 
 */
var any = function(items) {
	var index = 0, len = items.length;
	for (; index < len; index++)
	{
		if (items[index]) { return true; }
	}
	return false;
};


/**
 * 
 * @param  {String} command_name
 * @param  {Object} args         
 * @param  {Object} init_args    
 * @return {Object} 
 */
var make_command = function(command_name, args, init_args) {
	return {
		command_name: command_name,
		data: {
			args: args || {},
			init_args: init_args
		},
	};
};



var exports = {
	normalizeError: normalizeError,
	isNumber: isNumber,
	all: all,
	any: any,
	make_command: make_command
};


module.exports = exports;

