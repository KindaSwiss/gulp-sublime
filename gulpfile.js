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
		.pipe(babel())
		.on('error', handleError)
		.pipe(gulp.dest(config.js.dest))
});


gulp.task('watch', function () {
	gulp.watch(config.js.src, ['javascript']);
});


gulp.task('default', ['watch']);



// gulp.on('task_start', function (task) {
// 	console.log('           Task Start:', task.task);
// });

// gulp.on('task_stop', function (task) {
// 	console.log('           Task Stop:', task.task);
// });




