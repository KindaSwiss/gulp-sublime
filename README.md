# sublimejs

This is meant to be paired with [sublimegulpserver](https://github.com/KindaSwiss/sublimegulpserver). 

This is a tool I use for showing error messages from gulp files in Sublime Text 3. It has a few features. 

It can: 
- Display an error message in the status bar showing the file, line number, and plugin that caused the error. 
- Scroll the line where the error occured if the file is open 
- Show a gutter icon next to the line where the error occured 
- Show a popup message, which is simple new feature as of ST3 3083.  

Any of these things can be enabled/disabled in the package settings. The status bar and popup messages format can be customized as well. 

## Example usage 

```Javascript
var gulp = require('gulp');
var sass = require('gulp-sass');
var sublime = require('sublime')

sublime.config({
	gulp: gulp, 
	port: {Integer} // optional 
});

gulp.task('compile-sass--plumber', function () {
	
	return gulp.src(paths.sass)
		.pipe(plumber({ 
			errorHandler: function (err) {
				
				// The first argument should be the task name 
				sublime.show_error('compile-sass--plumber', err);

				// Keep gulp watch going by calling done or this.emit('end')
				done();
			} 
		}))
		
		.pipe(sass())
		
		.pipe(gulp.dest(paths.sassDest));
});

```

`sublime.config` is called and is passed the gulp object. This adds a listener to gulp's `task_start` event so that error gutter icons, and status messages are automatically removed. A port may also be specified, but must also must be changed in sublimegulpserver package settings. 

The first argument to `sublime.show_error` is the key to associate with the error, which must be the task name. The second argument should be an error object. 







