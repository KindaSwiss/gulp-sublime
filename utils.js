
var path = require('path');


var normalizeError = function (err, id) {
	var pluginName = err.plugin || id;
	var line = (err.line || err.lineNumber) - 1;
	var file = err.file || err.fileName;
	var message = err.message;

	// Fix the case where the file being processed by gulp-sass 
	// isn't an imported partial 
	if (file === 'stdin' && pluginName === 'gulp-sass') {
		file = err.message.split('\n')[0];
	}

	// Just in case any error message (such as autoprefixer) produce an 
	// extremely long error message 
	if (message.length > 2000) {
		message = message.substring(0, 2000);
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

		message: message,
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
	make_command: make_command
};




module.exports = exports;



