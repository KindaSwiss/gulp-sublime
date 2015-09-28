var gulp = require('gulp');
var sublime = require('../../../index').config({ gulp: gulp });

gulp.task('default', ['watch']);