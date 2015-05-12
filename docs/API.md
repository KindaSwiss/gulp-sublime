

## API


### sublime.connect
Connect to the server 

```Javascript
sublime.connect(onConnectHandler)
```


### sublime.disconnect
Disconnect from the server 

```Javascript
sublime.disconnect(onDisconnectHandler)
```


### sublime.run
Run a gulp command 

```Javascript
sublime.run('set_status', { message: 'Delicious apple cider' })
```


### sublime.run_command 
Run a Sublime Text command (Not yet implemented)


### sublime.set_status
Set a status bar message. Using the same status key will overwrite the previous status bar message. 

```Javascript
sublime.set_status('unique_status_key', 'Status message')
```


### sublime.erase_status
Erase a status bar message. 

```Javascript
sublime.erase_status('status_key')
```


### sublime.show_error
Show a status bar message in sublime text from an error object 

```Javascript
var errorHandler = sublime.show_error('Sass')

gulp.task('compile-sass', function (done) {
	sublime.erase_status('compile-sass')

	return gulp.src(paths.sass)
		
		.pipe(sass())
		
		// Emits an "end" event so gulp watch doesn't stop 
		.on('error', errorHandler)
		
		.pipe(autoprefixer())
		.pipe(gulp.dest(paths.sassDest))

```


### sublime.hide_error 
Erase a status message (Not yet implemented)






