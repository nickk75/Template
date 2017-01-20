var gulp          = require('gulp');
var notify        = require('gulp-notify');
var source        = require('vinyl-source-stream');
var browserify    = require('browserify');
var babelify      = require('babelify');
var ngAnnotate    = require('browserify-ngannotate');
var browserSync   = require('browser-sync').create();
var rename        = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var uglify        = require('gulp-uglify');
var merge         = require('merge-stream');

// Where our files are located
var jsFiles   = "src/js/**/*.js";
var viewFiles = "src/js/**/*.html";

// Pipes all the errors that are resived to a console log
var interceptErrors = function(error) {
  var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
};

/*
It's a third party module browserify.org, it allows us to import all the different components
with the 'import' variable as shown in app.js,
i.e it looks for the index.js file in the ./services folder by default
Browsers don't support import/export by default so browserify is essential

CREATES MODULAR CODE
*/
// it pipes out all our code into a single js file, that's not really human readable, so it's easy and quick to load
gulp.task('browserify', ['views'], function() {
  return browserify('./src/js/app.js')
  // can traslate the es6 to es5, in case the browser doesn't support es5
      .transform(babelify, {presets: ["es2015"]})
      // ngInject let's babelify be able to do that
      .transform(ngAnnotate)
      .bundle()
      .on('error', interceptErrors)
      //Pass desired output filename to vinyl-source-stream
      .pipe(source('main.js'))
      // Start piping stream to tasks!
      .pipe(gulp.dest('./build/'));
});

// it pipes out all our code into a single html file, that's not really human readable, so it's easy and quick to load
gulp.task('html', function() {
  return gulp.src("src/index.html")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/'));
});

// Here we are using the gulp-angular-templatecache
// it grabs all the templates and turns it a app.templates.js,
// so the site doesn't have to load all the data over and over again
gulp.task('views', function() {
  return gulp.src(viewFiles)
      .pipe(templateCache({
        standalone: true
      }))
      .on('error', interceptErrors)
      .pipe(rename("app.templates.js"))
      .pipe(gulp.dest('./src/js/config/'));
});

// This task is used for building production ready
// minified JS/CSS files into the dist/ folder
gulp.task('build', ['html', 'browserify'], function() {
  var html = gulp.src("build/index.html")
                 .pipe(gulp.dest('./dist/'));

  var js = gulp.src("build/main.js")
               .pipe(uglify())
               .pipe(gulp.dest('./dist/'));

  return merge(html,js);
});

// This is the default task, if you type 'gulp', this is what's been executed
// ['html', 'browserify'] = 'hint', this let's gulp know the different things that need to be run before invoking this function
gulp.task('default', ['html', 'browserify'], function() {

// browserSync watches for any changes, when something is changes it auto refreshes the page
  browserSync.init(['./build/**/**.**'], {
    // creating our server at ./build folder on port 5000
    server: "./build",
    port: 5000,
    notify: false,
    ui: {
      port: 5001
    }
  });

//
  gulp.watch("src/index.html", ['html']);
  gulp.watch(viewFiles, ['views']);
  gulp.watch(jsFiles, ['browserify']);
});
