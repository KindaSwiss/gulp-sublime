

## API


### sublime.connect(handler)

Connect to the server 

```Javascript
sublime.connect(function () {
	// 
});
```

#### handler

Type: `Function`

A function to listen to the `connect` event of the socket. 


<br>


### sublime.disconnect(handler)

Disconnect from the server 

```Javascript
sublime.disconnect(function () {
	// 
});
```

#### handler

Type: `Function`

A function to listen to the `close` event of the socket. 

<br>



### sublime.run(command_name, args, init_args)

Run a gulp command 

```Javascript
sublime.run('set_status', { message: 'Delicious apple cider' }, { views: [file] })
```

#### command_name

Type: `String`

The name of the command to run 

#### args

Type: `Object`

The arguments to pass to the command

#### init_args

Type: `Object`

The arguments to pass to the command's \_\_init\_\_ function. Possible arguments are `views` which may be '&lt;all&gt;' for all views or a array of file names. The file names will be used to match views with the same open file. 


<br>


### sublime.set_status(id, message)
Sets a status bar message in *all* views. 

```Javascript
sublime.set_status('Sass', 'Compiled!')
```


#### id

Type: `String`

An ID to associate with the status message. Using the same status key will overwrite the previous status bar message. 

#### message

Type: `String`

The message to show in the status bar. 


<br>


### sublime.erase_status(id)

Erase a status bar message from *all* views. 

```Javascript
sublime.erase_status('Sass')
```


#### id

Type: `String`

The ID of the status bar message to be removed 


<br>



### sublime.show_error(err)

Shows a status bar error message, an error popup message, and a gutter icon next to the line that caused the error.

```Javascript
gulp.task('compile-sass', function (done) {
	sublime.erase_status('compile-sass')
	
	// Must return the stream
	return gulp.src(paths.sass)
		
		.pipe(sass())
		
		.on('error', function (err) {
			sublime.show_error(err);

			// Call done or this.emit('end') to keep the watch going 
			this.emit('end')
		})
		
		.pipe(autoprefixer())
		.pipe(gulp.dest(paths.sassDest))

```

#### err

Type: `Object`

The error object 


<br>


### sublime.config(options)

Configures the port on which to connect to Sublime Text. 

```Javascript
var gulp = require('gulp');
var sublime = require('gulp-sublime');
sublime.config({ port: 12345 })
```

#### options

Type: `Object`

#### options.port (optional)

Type: `Integer`

The port to connect to Sublime on.


<br>


### sublime.reporter(id)

A reporter meant solely for JSHint. The when run, it will open a new tab in Sublime with the results appearing and functioning the same as "Find in Files" results. If the tab has already been created, the results will be updated. The string passed to `sublime.reporter` will be used to identify the tab. 

```Javascript
gulp.task('js-hint', function (done) {
	return gulp.src(paths.js).
		pipe(jshint()).
		pipe(sublime.reporter('jshint')).

		// For some reason sublime.reporter is not called when called 
		// when put after jshint.reporter, so it must be put first 
		pipe(jshint.reporter('jshint-stylish'));
});
```

### id

Type: `String`

The ID to associate with the reporter. The ID is used to identify a view so that only one is used per report. 


<br>


### sublime.erase_errors(id)

Remove gutter icons and status messages associated with errors. 

```Javascript
sublime.erase_errors('Sass')
```

#### id 

Type: `String`

The ID associated with the errors, which should be the task name. 






