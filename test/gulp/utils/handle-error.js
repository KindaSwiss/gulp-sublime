var gulp = require('gulp');
var sublime = require('../../../index');


var handleError = {
	errorHandler: function (err) {
		sublime.show_error(err)
		console.log(err.message);
		this.emit('end');
	}
};

module.exports = handleError;

