var gulp   = require('gulp');
var babel  = require('gulp-babel');

var config = {
	js: {
		src : 'src/**/*.js',
		dest: './'
	},
};

var handleError = function (err) {
	console.log(err.message);
	this.emit('end');
};

gulp.task('javascript', function () {
	return gulp.src(config.js.src)
		.pipe(babel({ optional: ["es7.asyncFunctions"]}))
		.on('error', handleError)
		.pipe(gulp.dest(config.js.dest))
});

gulp.task('watch', function () {
	gulp.watch(config.js.src, ['javascript']);
});

gulp.task('default', ['watch']);