# gulp-sublime

This is a tool I use for sending error messages to Sublime Text. I use it along with  [sublimegulpserver](https://github.com/anthonykoch/sublimegulpserver) to receive the messages. 

## Features
- Displays an error message in the status bar showing the file, line number, and plugin that caused the error. 
- Scrolls to the line where the error occured if the file is open 
- Shows a gutter icon next to the line where the error occured 
- Shows a popup message (ST3 version must be greater than 3083) 
- Shows the results from JSHint that will display in the format of a "Find in Files" tab

__Note:__  The `scroll to error` and `gutter icon` features do not work with Sass entry files (non partials). 

Any of these features can be enabled/disabled in the package settings. The status bar and popup messages format can be customized as well. 

## Example usage 

```Javascript
var gulp    = require('gulp');
var sass    = require('gulp-sass');
var react   = require('gulp-react');
var jshint  = require('gulp-jshint');
var sublime = require('gulp-sublime');
var plumber = require('gulp-plumber');

sublime.config({
	port: {Integer} // optional 
});

var handleError = { 
	errorHandler: function (err) {
		sublime.show_error(err);
		// Keep gulp watch going by calling done or this.emit('end')
		this.emit('end');
	} 
}

gulp.task('sass', function (done) {
	return gulp.src(config.src)
		.pipe(plumber(handleError))
		.pipe(sass())
		.pipe(gulp.dest(config.dest));
});

gulp.task('javascript', function(done) {
	// The task must be returned or else the reporter won't work 
	return gulp.src(config.src)
		.pipe(plumber(handleError))
		.pipe(react({ harmony: true }))
		.pipe(jshint(config.settings.jshint))
		.pipe(sublime.reporter(null, 'jshint practice'))
});
```
All that needs to be done is to pass `sublime.show_error` an error object. 

The first argument to `sublime.reporter` should be `null`. The second argument is optional and is used as the name of the results tab. If not passed, the name will default to the task name. 

## JSX error
![react error example](https://github.com/KindaSwiss/gulp-sublime/blob/master/images/jsx-error.png)

## Sass Error
![sass error example](https://github.com/KindaSwiss/gulp-sublime/blob/master/images/sass-error.png)










