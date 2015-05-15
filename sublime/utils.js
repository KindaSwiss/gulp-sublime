
var path = require('path');

var objectTag = '[object Object]';

var exports = {
	isNumber: function(value) {
		value = value - 0;
		return value === value && typeof value === 'number' && isFinite(value);
	},
	isObject: function (value) {
		return Object.prototype.toString.call(value) === objectTag;
	},
	isString: function (value) {
		return typeof value === 'string';
	},
	normalizeError: function (err) {
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
			
	}
};


module.exports = exports;

