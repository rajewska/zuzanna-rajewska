// Error Handling with Plumber
var onError = function(err) {
    console.log(err);
}

//
// G U L P  L O A D E R
//
var gulp 		 = require('gulp'),				// Gulp core
	gutil 		 = require('gulp-util'),		// Gulp utilities
	del 		 = require('del'), 				// rm -rf
	pug 		 = require('pug'),				// Formerly known as JADE
	gulpPug 	 = require('gulp-pug'),			// Formerly known as JADE
	filter		 = require('gulp-filter'),		// Filter for paths (using it to hide underscore folders)
	sass 		 = require('gulp-sass'),		// SASS
	uglify 		 = require('gulp-uglify'),		// For Javascript
	imagemin	 = require('gulp-imagemin'), 	// Image minify
	notify		 = require('gulp-notify'),		// For pretty notifications
	browserSync	 = require('browser-sync').create(),
	merge		 = require('merge-stream'),		// merge() command for tasks with multiple sources
	cmq		 	 = require('gulp-group-css-media-queries'); // Combines media queries
//
// V A R I A B L E S
//

// Sets environment variables through gulp-util
// To invoke: $ gulp --env=prod
var env = gutil.env.env;
var sourceDir = 'app';
var outputDir = '.tmp';

if (env === 'prod') {
	outputDir = 'dist';
	console.log("hello");
}
if (env === 'dev') {
}

//
// G U L P  T A S K S
//

// Clean output dir first
gulp.task('clean', function() {
	return del(outputDir + '/**/*');
});

// Process HTML
gulp.task('html', function(){
	return gulp.src(sourceDir + '/**/*.pug')
		// Filter out files and folders beginning with _ (for includes etc)
		.pipe(filter(function (file) {
            return !/\/_/.test(file.path) && !/^_/.test(file.relative);
        }))
		.pipe(gulpPug({
			pug: 		pug,
			basedir: 	sourceDir,	// make this this explicit for absolute paths on includes
			pretty: 	true
		}))
		.pipe(gulp.dest(outputDir))
		.pipe(notify({ message: 'HTML task complete' }));
});

// Process styles
gulp.task('styles', ['cmq'], function(){
	// SASS configuration parameters
	var config = {
		// Include paths to bower components
		includePaths: [
			'bower_components/bootstrap-sass/assets/stylesheets',
			'bower_components/sass-mq'
		]
	};

	if (env === 'prod') {
		config.outputStyle = 'compressed';
	}

	if (env === 'dev') {
		config.outputStyle = 'map';
	}

	return gulp
		.src(sourceDir + '/styles/**/*.{scss,sass}')
		.pipe(sass(config))
		.pipe(gulp.dest(outputDir + '/styles'))
		.pipe(browserSync.stream())
		.pipe(notify({ message: 'Styles task complete' }));
});

// Combine Media Queries
gulp.task('cmq', function () {
	return gulp.src(outputDir + "/styles/**/*.css")
		.pipe(cmq())
		.pipe(gulp.dest(outputDir + "/styles"))
		.pipe(notify({ message: 'Media Queries Combined' }));
});

// Copy fonts
gulp.task('fonts', function(){
	return gulp.src([
			sourceDir + '/fonts/MonoSocialIconsFont-1.10.*' // Mono Social Icons
		])
		.pipe(gulp.dest(outputDir + '/fonts'))
		.pipe(notify({ message: 'Fonts task complete' }));
});

// Process scripts
gulp.task('scripts', function() {
	// Minify and copy all JavaScript (except vendor scripts)
	var js = gulp.src(sourceDir + "/scripts/**/*.js")
		.pipe(uglify())
		.pipe(gulp.dest(outputDir + '/scripts'));

	// Copy vendor files
	var vendor = gulp.src([
	  	// 'bower_components/slicknav/dist/jquery.slicknav.min.js',	// Slicknav
	  	// 'bower_components/jquery/dist/jquery.min.js'				// Jquery
		])
	.pipe(gulp.dest(outputDir + '/scripts/vendor'));

	return merge(js,vendor);
});

// Compress and minify images to reduce their file size
gulp.task('images', function() {
	return gulp.src(sourceDir + '/**/*.{jpg,png,svg,ico}')
		.pipe(imagemin())
		.pipe(gulp.dest(outputDir))
		.pipe(notify({ message: 'Images task complete' }));
});

// Gulp Watch
gulp.task('watch', function() {
	gulp.watch(sourceDir + '/**/*.pug', ['html']).on('change', browserSync.reload);
	gulp.watch(sourceDir + '/scripts/**/*.js', ['scripts']);
	gulp.watch(sourceDir + '/**/*.{jpg,png,svg,ico}', ['images']);
	gulp.watch(sourceDir + '/styles/**/*.{scss,sass}', ['styles','cmq']);
	gulp.watch(sourceDir + '/fonts/**/*', ['fonts']);
});

// Development Server
gulp.task('serve', ['build'], function(done) {
	browserSync.init({
		open: false,
		port: 9000,
		server: outputDir
	},done);
});

// Build
gulp.task('build', ['clean'], function() {
	return gulp.start(['html', 'scripts', 'images', 'styles', 'fonts']);
});

// Default task
gulp.task('default', ['serve', 'watch']);