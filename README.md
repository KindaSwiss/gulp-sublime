# sublimejs

This is meant to be paired with [sublimegulpserver](https://github.com/KindaSwiss/sublimegulpserver). 

This is a tool I use for showing error messages from gulp files in Sublime Text 3. For example, if a Sass compilation error occurs, the file basename and line number will show in the status bar of each tab. 




## Example uses: 

There are two ways to send a status bar error message:

- Use the function returned from `sublime.show_error` to handler the error directly. The function returned will emit an `end` event so that gulp watch doesn't stop. 

- Pass the error object as a second argument to `sublime.show_error`. No `end` event is emitted when used this way, so `done` can be called manually. 



```Javascript

// The string passed is used as the key for the status bar message 
var errorHandler = sublime.show_error('compile-sass');

gulp.task('compile-sass', function (done) {
	
	// Have to erase the status bar message every time the task 
	// is run or else previous error messages will remain on the status bar
	sublime.erase_status('compile-sass')
	
	return gulp.src(paths.sass)
		
		.pipe(sass())
		
		// Emits an "end" event so gulp watch doesn't stop 
		.on('error', errorHandler)
		
		.pipe(autoprefixer())

		.on('error', function (err) {
			// Does not emit the "end" event, done can be called manually 
			var status = sublime.show_error('compile-sass', err);
			console.log(status)
			done();
		})

		.pipe(gulp.dest(paths.sassDest));
});

```



An example using plumber 

```Javascript

gulp.task('compile-sass--plumber', function () {

	sublime.erase_status('compile-sass--plumber')

	return gulp.src(paths.sass)
		.pipe(plumber({ errorHandler: sublime.show_error('compile-sass--plumber') }))
		
		.pipe(sass())

		.pipe(gulp.dest(paths.sassDest));
});

```




