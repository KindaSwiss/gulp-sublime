
var gulp        = require('gulp');
var sass        = require('gulp-sass');
var plumber     = require('gulp-plumber');
var config      = require('../config').sass;
var handleError = require('../utils/handle-error')


gulp.task('sass', function (done) {
	return gulp.src(config.src)
		.pipe(plumber(handleError('sass')))
		.pipe(sass(config.settings.sass))
		.pipe(gulp.dest(config.dest))
});








		