
var gulp = require('gulp');

// Configure sublime 
require('../../../index').config({ gulp: gulp, dev: true });

gulp.task('default', ['watch']);




