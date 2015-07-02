

# API


### sublime.showError(err, id)

Sends the error to Sublime Text. 

Using .on('error')

```Javascript
var errorHandler = function (err) {
	sublime.showError(err, 'sass');
	this.emit('end');
};

gulp.task('sass', function (done) {
	
	return gulp.src(paths.sass)
		.pipe(sass())
		.on('error', errorHandler)
		.pipe(autoprefixer())
		.on('error', errorHandler)
		.pipe(gulp.dest(paths.sassDest))
});

```

Using plumber 

```Javascript

var errorHandler = function (taskName) {
	return {
		errorHandler: return function (err) {
			sublime.showError(err, taskName);
			this.emit('end');
		};
	}
};

gulp.task('sass', function () {
	gulp.src(config.src)
		.pipe(plumber(errorHandler('sass')))
		.pipe(sass())
});
```


#### err

Type: `Object`

The error object. 


#### id

Type: `String`

Must be the name of the task the error occured in. 



<br>



### sublime.eraseErrors(id)

Remove gutter icons and status messages associated with id. 

```Javascript
sublime.eraseErrors('Sass')
```


#### id 

Type: `String`

The ID associated with the errors, which should be the task name. 



<br>



### sublime.reporter(id)

A reporter meant solely for JSHint. The when run, it will open a new tab in Sublime with the results appearing and functioning the same as "Find in Files" results. If the tab has already been created, the results will be updated. The string passed is used to identify the tab so that previous results are overwritten, rather than opening a new tab every time it runs. 

```Javascript
gulp.task('js-hint', function (done) {
	return gulp.src(paths.js).
		pipe(jshint()).
		pipe(sublime.reporter('jshint')).

		// If using the jshint reporter then put it after sublime.reporter 
		pipe(jshint.reporter('jshint-stylish'));
});
```


### id

Type: `String`

The ID to associate with the reporter. The ID is used to identify a view so that only one is used per report. 



<br>



### sublime.run(command, args, init_args)

Run a gulp command in Sublime Text. 

```Javascript
sublime.run('set_status', { message: 'Delicious apple cider' }, { views: [file] })
```


#### command

Type: `String`

The name of the command to run or a premade command object. 


#### args

Type: `Object`

The arguments to pass to the command. 


#### init_args

Type: `Object`

The arguments to pass to the command's \_\_init\_\_ function. Possible arguments are `views` which may be '&lt;all&gt;' for all views or a array of file names. The file names will be used to match views with the same open file. 



<br>



### sublime.setStatus(id, message)
Sets a status bar message in *all* views. 

```Javascript
sublime.setStatus('Sass', 'Compiled!')
```


#### id

Type: `String`

An ID to associate with the status message. Using the same status key will overwrite the previous status bar message. 


#### message

Type: `String`

The message to show in the status bar. 



<br>



### sublime.eraseStatus(id)

Erase a status bar message from *all* views. 

```Javascript
sublime.eraseStatus('Sass')
```


#### id

Type: `String`

The ID of the status bar message to be removed. 



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



### sublime.connect()

Connect to the server. 

```Javascript
sublime.connect();
```



<br>




### sublime.disconnect(handler)

Disconnect from the server.  

```Javascript
sublime.disconnect(function () {
	// 
});
```

#### handler

Type: `Function`

A function to listen to the `close` event of the socket. 




## Events


### disconnect

Emitted when the socket disconnects. 


### connect 

Emitted when the socket connects. 


### run

Emitted when a command is sent to Sublime. 



