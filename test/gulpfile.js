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




var logError = function(err) {
	// Log only the first line of the error message
	gutil.log(err.message.split(/\n/)[0] || '');
}




var paths = {
	'sass': 'sass/**/*.sass',
	'sassDest': 'stylesheets',
};




gulp.task('default', ['watch']);




sublime.connect();
sublime.config(gulp);




/**
 * Handle the error with plumber. sublime.show_error('compile-sass--plumber') 
 * should return a function that will handle the error 
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


/**
 * Handle the error with sublime.show_error indirectly. The function returned should 
 * not emit an "end" event even though it is being used like a direct error handler. 
 */
gulp.task('compile-sass--handle-indirect', function (done) {

	return gulp.src(paths.sass).
		
		pipe(sass({
			indentedSyntax: true,
		})).
		on('error', function (err) {
			// Should not emit an "end" event, which means done can be called manually 
			sublime.show_error('compile-sass--handle-indirect', err);
			done();
		}).
	
		pipe(gulp.dest(paths.sassDest));
});


/**
 * Handle the error directly with the function returned from sublime.show_error.
 * The function should emit an "end" event since the "this" value is bound to the 
 * returned function.  
 */
gulp.task('compile-sass--handle-direct', function (done) {

	return gulp.src(paths.sass).
		
		pipe(sass({
			indentedSyntax: true,
		})).
		on('error', sublime.show_error('compile-sass--handle-direct')).
	
		pipe(gulp.dest(paths.sassDest));
});


gulp.task('watch', function () {

	var watcher = gulp.watch([
			paths.sass,
		],
		[
			'compile-sass--plumber',
			// 'compile-sass--handle-indirect',
			// 'compile-sass--handle-direct',
		]
	);

});




