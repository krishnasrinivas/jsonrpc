var babel = require('gulp-babel')
var exec = require('child_process').exec
var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var notify = require('gulp-notify');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');

gulp.task('default', ['test'], function() {})

gulp.task('compile', function(cb) {
  compile('src/main/**/*.js', 'minio.js', 'dist/main', cb)
})

gulp.task('jscs', function() {
  gulp.src('src/main/*.js')
    .pipe(jscs())
    .pipe(notify({
      title: 'JSCS',
      message: 'JSCS Passed. Let it fly!'
    }))
});

gulp.task('lint', function() {
  gulp.src('src/main/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(notify({
      title: 'JSHint',
      message: 'JSHint Passed. Let it fly!',
    }))
});

function compile(src, name, dest, cb) {
  gulp.src(src)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dest))
    .on('end', function() {
      cb()
    })
}
