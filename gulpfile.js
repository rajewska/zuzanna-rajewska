var autoprefixer, browserSync, changed, cleanCss, cmq, config, del, filter, gulp, gulpIf, gulpPug, gutil, htmlReplace, imagemin, merge, notify, plumber, pug, sass, sourcemaps, spawn, uglify;

gulp = require('gulp');
gutil = require('gulp-util');
gulpIf = require('gulp-if');
changed = require('gulp-changed');
del = require('del');
sourcemaps = require('gulp-sourcemaps');
plumber = require('gulp-plumber');
pug = require('pug');
gulpPug = require('gulp-pug');
filter = require('gulp-filter');
sass = require('gulp-sass');
uglify = require('gulp-uglify');
imagemin = require('gulp-imagemin');
notify = require('gulp-notify');
browserSync = require('browser-sync').create();
merge = require('merge-stream');
cmq = require('gulp-group-css-media-queries');
autoprefixer = require('gulp-autoprefixer');
cleanCss = require('gulp-clean-css');
htmlReplace = require('gulp-html-replace');

config = {
    production: gutil.env.production,
    sourceDir: 'app',
    outputDir: '.tmp',
    plumber: {
        errorHandler: function(err) {
            console.log(err);
            return this.emit('end');
        }
    }
};

if (config.production) {
    config.outputDir = 'dist';
}

gulp.task('clean', function() {
    return del(config.outputDir + '/**/*');
});

gulp.task('html', function() {
    config.htmlReplaceSrc = 'http://localhost:9000/';
    config.htmlReplaceTpl = '<base href="%s">';
    if (config.type) {
        config.htmlReplaceSrc = 'http://rajewska.com/';
    }
    config.htmlReplace = {
        base: {
            src: config.htmlReplaceSrc,
            tpl: config.htmlReplaceTpl
        }
    };
    return gulp.src(config.sourceDir + '/**/*.pug').pipe(plumber(config.plumber)).pipe(filter(function(file) {
        return !/\/_/.test(file.path) && !/^_/.test(file.relative);
    })).pipe(gulpPug({
        pug: pug,
        basedir: config.sourceDir,
        pretty: true
    })).pipe(htmlReplace(config.htmlReplace)).pipe(gulp.dest(config.outputDir)).pipe(notify({
        message: 'HTML task complete'
    }));
});

gulp.task('styles', function() {
    var opStyle, outputStyle;
    opStyle = 'map';
    if (config.production) {
        outputStyle = 'compressed';
    }
    return gulp.src(config.sourceDir + '/styles/**/*.{scss,sass}').pipe(plumber(config.plumber)).pipe(sourcemaps.init()).pipe(sass({
        includePaths: ['bower_components/bootstrap-sass/assets/stylesheets', 'bower_components/sass-mq', 'bower_components/monosocialiconsfont'],
        outputStyle: outputStyle
    })).pipe(cmq()).pipe(gulpIf(config.production, autoprefixer())).pipe(gulpIf(config.production, cleanCss({
        compatibility: 'ie8'
    }))).pipe(gulpIf(!config.production, sourcemaps.write())).pipe(gulp.dest(config.outputDir + '/styles')).pipe(browserSync.stream()).pipe(notify({
        message: 'Styles task complete'
    }));
});

gulp.task('fonts', function() {
    return gulp.src(['bower_components/bootstrap-sass/assets/fonts/**/*', 'bower_components/monosocialiconsfont/**/MonoSocialIconsFont-1.10.*']).pipe(plumber(config.plumber)).pipe(gulp.dest(config.outputDir + '/fonts')).pipe(notify({
        message: 'Fonts task complete'
    }));
});

gulp.task('scripts', function() {
    var js, vendor;
    js = gulp.src(config.sourceDir + '/scripts/**/*.js').pipe(plumber(config.plumber)).pipe(gulpIf(config.production, uglify())).pipe(gulp.dest(config.outputDir + '/scripts'));
    vendor = gulp.src(['bower_components/jquery/dist/jquery.min.*', 'bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.*']).pipe(gulp.dest(config.outputDir + '/scripts/vendor'));
    return merge(js, vendor);
});

gulp.task('images', function() {
    return gulp.src(config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}').pipe(plumber(config.plumber)).pipe(changed(config.outputDir)).pipe(gulpIf(config.production, imagemin())).pipe(gulp.dest(config.outputDir)).pipe(notify({
        message: 'Images task complete'
    }));
});

gulp.task('watch', function() {
    gulp.watch(config.sourceDir + '/**/*.pug', ['html']).on('change', browserSync.reload);
    gulp.watch(config.sourceDir + '/scripts/**/*.js', ['scripts']);
    gulp.watch(config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}', ['images']);
    gulp.watch(config.sourceDir + '/styles/**/*.{scss,sass}', ['styles']);
    gulp.watch(config.sourceDir + '/fonts/**/*', ['fonts']);
});

spawn = require('child_process').spawn;

gulp.task('watch:gulp', function() {
    var p;
    p = void 0;
    gulp.watch(['gulpfile.coffee'], function() {
        if (p) {
            p.kill();
        }
        p = spawn('gulp', ['build'], {
            stdio: 'inherit'
        });
    });
});

gulp.task('serve', ['build'], function(done) {
    browserSync.init({
        open: false,
        port: 9000,
        server: config.outputDir
    }, done);
});

gulp.task('build', ['clean'], function() {
    return gulp.start(['html', 'scripts', 'images', 'styles', 'fonts']);
});

gulp.task('default', ['serve', 'watch', 'watch:gulp']);