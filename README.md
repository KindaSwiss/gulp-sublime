# gulp-sublime

This is a tool I use for sending [Gulp](https://github.com/gulpjs/gulp/) error messages to Sublime Text. There is an accompanying Sublime Text package called [sublimegulpserver](https://github.com/anthonykoch/sublimegulpserver), which is the part that actually receives the messages from the gulp file. 

## Features

- Displays an error message in the status bar showing the file, line number, and plugin that caused the error. 
- Scrolls to the line where the error occured if the file is open 
- Shows a gutter icon next to the line where the error occured 
- Shows a popup message (ST3 version must be greater than 3083) 

Any of these features can be enabled/disabled in the package settings in the Sublime Text plugin. The status bar and popup messages format can be customized as well. 

## Plugin compatibility 

It works with Sass (with a quirk), BabelJS, and really any plugin that emits an error with a filename and line number. The quirk with Sass is that the "scroll to error" and "gutter icon" features don't work for Sass entry files (non-partials). 

## The setup 

```Javascript
var gulp    = require('gulp');
var sass    = require('gulp-sass');
var react   = require('gulp-babel');
var plumber = require('gulp-plumber');

// Pass in gulp! 
var sublime = require('gulp-sublime').config({ gulp: gulp });

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

gulp.task('sass', function() {
	return gulp.src(config.src)
		// must pass in the task name 
		.pipe(plumber(handleError('sass')))
		.pipe(sass())
		.pipe(gulp.dest(config.dest));
});

gulp.task('javascript', function() {
	return gulp.src(config.src)
		.pipe(plumber(handleError('javascript')))
		.pipe(babel())
		.pipe(gulp.dest(config.dest))
});
```

Without plumber, it's basically the same thing, except a function is returned instead of an object. 

```
var errorHandler = function(taskName) {
	return function(err) {
		sublime.showError(err, taskName);
		this.emit('end');
	};
};

gulp.task('javascript', function() {
	return gulp.src(config.src)
		.pipe(babel())
		.on('error', errorHandler('javascript'));
});
```

It's pretty simple. Just pass the error and task name to `sublime.showError` in the error handler. The task name is used as the ID for the status message and gutter icon regions. If the incorrect task name is passed, the status messages and icons will not be erased. 

It's important to note that the gulp object needs to be passed to the sublime object through its `config` function or else error status messages, icon regions, etc. will not be removed properly. 

## The plugin in action 
![react error example](https://github.com/anthonykoch/gulp-sublime/blob/master/images/jsx-error.png)




