/*
	Watch files 
 */
var gulp = require('gulp');
var config = require('../config');
var sublime = require('../../../index');

gulp.task('watch', function () {
	var watchers = [
		gulp.watch(config.sass.src, ['sass']),
		gulp.watch(config.js.src, ['javascript'])
	];

	sublime.watchers(watchers);
});

