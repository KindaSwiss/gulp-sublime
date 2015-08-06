# gulp-sublime

This is a tool I use for sending [Gulp](https://github.com/gulpjs/gulp/) error messages to Sublime Text. I use it along with  [sublimegulpserver](https://github.com/anthonykoch/sublimegulpserver) to receive the messages. 

## Features
- Displays an error message in the status bar showing the file, line number, and plugin that caused the error. 
- Scrolls to the line where the error occured if the file is open 
- Shows a gutter icon next to the line where the error occured 
- Shows a popup message (ST3 version must be greater than 3083) 
- Shows the results from JSHint that will display in the format of a "Find in Files" tab. 

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

// Pass in gulp 
sublime.config({ gulp: gulp });

var handleError = function (taskName) {
	return { 
		errorHandler: function (err) {
			// Pass the error object and the task name 
			sublime.showError(err, taskName);
			// Keep gulp.watch going 
			this.emit('end');
		} 
	};
};

gulp.task('sass', function () {
	return gulp.src(config.src)
		.pipe(plumber(handleError('sass')))
		.pipe(sass())
		.pipe(gulp.dest(config.dest));
});

gulp.task('javascript', function() {
	return gulp.src(config.src)
		.pipe(plumber(handleError('javascript')))
		.pipe(react({ harmony: true }))
		.pipe(jshint(config.settings.jshint))
		.pipe(sublime.reporter('jshint blog'))
});
```


In a error handler, whether it be .on('error') or plumber handler, pass the error object to `sublime.showError` as well as the task name. The task name is used as the ID for the status message and gutter icon regions. If the incorrect task name is passed, the errors status messages and icons will not be erased. 

The first argument to `sublime.reporter` is used as the name and identifier of the results tab. The results tab will be overwritten every time the reporter is run. 

## JSX error
![react error example](https://github.com/anthonykoch/gulp-sublime/blob/master/images/jsx-error.png)




