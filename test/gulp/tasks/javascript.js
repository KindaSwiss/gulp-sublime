
var gulp          = require('gulp');
var plumber       = require('gulp-plumber');
var jshint        = require('gulp-jshint');
var config        = require('../config').js;
var handleError   = require('../utils/handle-error')
var sublime       = require('../../../index');

// Compress and concat js
gulp.task('javascript', function(done) {

	return gulp.src(config.src)
		.pipe(plumber(handleError('javascript')))
		.pipe(jshint(config.settings.jshint))
		.pipe(sublime.reporter('jshint gulp-sublime'))

});



