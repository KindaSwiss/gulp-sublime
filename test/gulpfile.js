'use strict';

/**
 * If an error is produced when compiling the Sass files, 
 * a status message should show in Sublime's status bar with 
 * the error details. When there is no error produced, the 
 * status message should be erased. 
 */

var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var sublime = require('../sublime');
var notify = require('gulp-notify');
var through = require('through2');
var notifier = require('node-notifier');
var jshint = require('gulp-jshint');




var logError = function(err) {
	// Log only the first line of the error message
	gutil.log(err.message.split(/\n/)[0] || '');
}




var paths = {
	'sass': 'sass/**/*.sass',
	'sassDest': 'stylesheets',
	'js': [
		'../sublime/**/*.js',
		'!../sublime/node_modules/**/*.js',
	]
};




gulp.task('default', ['watch']);




sublime.config({
	gulp: gulp
});




/**
 * Handle the error with plumber. 
 */
gulp.task('compile-sass--plumber', function (done) {

	return gulp.src(paths.sass).

		pipe(plumber({ 
			errorHandler: function (err) {
				sublime.show_error('compile-sass--plumber', err)
				done();
			}
		})).

		pipe(sass({
			indentedSyntax: true,
			// onSuccess runs for each file that is successfully compiled. 
			// It does not run when all files have been successfully compiled 
			onSuccess: function (file) {
				// console.log(file)
			}
		})).

		pipe(gulp.dest(paths.sassDest));
});




gulp.task('js-hint', function (done) {
	return gulp.src(paths.js).
		pipe(plumber({
			errorHandler: function () {
				this.emit('end');
			}
		})).
		pipe(jshint()).
		pipe(sublime.reporter('jshint')).

		// For some reason sublime.reporter is not called when 
		pipe(jshint.reporter('jshint-stylish'));
});





/**
 * Handle the error normally  
 */
gulp.task('compile-sass', function (done) {

	return gulp.src(paths.sass).
		
		pipe(sass({
			indentedSyntax: true,
		})).
		on('error', function (err) {
			sublime.show_error('compile-sass', err);
			// Must use this.emit('end') or done() to keep gulp watch going 
			done();
		}).
	
		pipe(gulp.dest(paths.sassDest));
});












gulp.task('watch', function () {

	var watcher = gulp.watch([
			paths.sass,
		],
		[
			'compile-sass--plumber',
			// 'compile-sass',
		]
	);

	var watcher = gulp.watch([
			paths.js,
		],
		[
			'js-hint'
		]
	);
});




