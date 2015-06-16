
var gulp        = require('gulp');
var sass        = require('gulp-sass');
var plumber     = require('gulp-plumber');
var config      = require('../config').sass;
var handleError = require('../utils/handle-error')


gulp.task('sass-plumber', function (done) {
	return gulp.src(config.src)
		.pipe(plumber(handleError))
		.pipe(sass(config.settings.sass))
		.pipe(gulp.dest(config.dest))
});




gulp.task('sass-onerror', function (done) {
	return gulp.src(config.src)

		.pipe(sass(config.settings.sass))
		.on('error', function (err) {
			sublime.show_error('compile-sass', err);
			// Must use this.emit('end') or done() to keep gulp watch going 
			this.emit('end');
		})
		.pipe(gulp.dest(config.dest))
});





		