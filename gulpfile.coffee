'use strict'
#
# G U L P  L O A D E R
# ====================
#
gulp = require('gulp')
gutil = require('gulp-util')  					# Gulp utilities
gulpIf = require('gulp-if')             # Run pipes conditionally
changed = require('gulp-changed')       # Only process tasks on changed files
del = require('del')  						  	  # rm -rf
sourcemaps = require('gulp-sourcemaps') # sourcemaps for CSS
plumber = require('gulp-plumber')       # plumber for error handling
pug = require('pug')  						    	# Formerly known as JADE
gulpPug = require('gulp-pug')  					# Formerly known as JADE
filter = require('gulp-filter') 				# Filter for paths (using it to hide underscore folders)
sass = require('gulp-sass') 				  	# SASS
uglify = require('gulp-uglify') 				# For Javascript
imagemin = require('gulp-imagemin') 		# Image minify
notify = require('gulp-notify') 				# For pretty notifications
browserSync = require('browser-sync').create()
merge = require('merge-stream') 				# merge() command for tasks with multiple sources
cmq = require('gulp-group-css-media-queries') 	# Combines media queries
autoprefixer = require('gulp-autoprefixer')     # Autoprefixes CSS for compatibility
cleanCss = require('gulp-clean-css')    # minify CSS

#
# C O N F I G
# ===========
config =
  # environment variables (for production)
  production: gutil.env.production

  # default paths
  sourceDir: 'app'
  outputDir: '.tmp'

  # Plumber configurations for not crashing gulp on errors
  plumber: {
    # this prevents SASS errors from crashing
    errorHandler: (err) ->
      console.log(err)
      this.emit('end')
  }

# set output dir to 'dist' for production
if config.production
  config.outputDir = 'dist'

#
# G U L P  T A S K S
# ==================
#


# Task: Clean output dir
gulp.task 'clean', ->
  del config.outputDir + '/**/*'


#
# Task: HTML
#
gulp.task 'html', ->
  gulp.src(config.sourceDir + '/**/*.pug')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Filters out files and folders starting with underscore
  .pipe(filter((file) ->
    !/\/_/.test(file.path) and !/^_/.test(file.relative)
  ))

  .pipe(gulpPug(
    pug: pug
    basedir: config.sourceDir
    pretty: true))

  .pipe(gulp.dest(config.outputDir))

  # Send out notification when done
  .pipe notify(message: 'HTML task complete')

#
# Task: Styles
#
gulp.task 'styles', ->
  # SASS configuration parameters
  opStyle = 'map'

  # Compress stylesheets for production
  if config.production
    outputStyle = 'compressed'

  gulp.src(config.sourceDir + '/styles/**/*.{scss,sass}')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Sourcemaps for CSS (step 1)
  .pipe(sourcemaps.init())
  
  .pipe(sass({

    # Include paths to components (add/remove manually)
    includePaths: [
      'bower_components/bootstrap-sass/assets/stylesheets'
      'bower_components/sass-mq'
      'bower_components/monosocialiconsfont'
    ]

    outputStyle: outputStyle
  }))

  # Combines media queries
  .pipe(cmq())

  # Autoprefixer for browser support (production)
  .pipe(gulpIf(config.production, autoprefixer()))

  # Minify
  .pipe(gulpIf(config.production, cleanCss({
    compatibility: 'ie8'
  })))

  # Sourcemaps for CSS (step 2)
  .pipe(gulpIf(!config.production, sourcemaps.write()))

  .pipe(gulp.dest(config.outputDir + '/styles'))

  # Updates browsers
  .pipe(browserSync.stream())

  # Send out notification when done
  .pipe notify(message: 'Styles task complete')

#
# Task: Fonts
#
gulp.task 'fonts', ->
  gulp.src([
    'bower_components/bootstrap-sass/assets/fonts/**/*'
    'bower_components/monosocialiconsfont/**/MonoSocialIconsFont-1.10.*'
  ])

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))
  .pipe(gulp.dest(config.outputDir + '/fonts'))

  # Send out notification when done
  .pipe notify(message: 'Fonts task complete')

#
# Task: scripts
#
gulp.task 'scripts', ->

  # Task 1: my scripts

  # Minify and copy all JavaScript (except vendor scripts)
  js = gulp.src(config.sourceDir + '/scripts/**/*.js')
  # gulp.src(config.sourceDir + '/scripts/**/*.js')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Uglify scripts (production)
  .pipe(gulpIf(config.production, uglify()))
  .pipe(gulp.dest(config.outputDir + '/scripts'))
  

  # Task 2: vendor scripts

  # Copy vendor files to output dir
  vendor = gulp.src([
    'bower_components/jquery/dist/jquery.min.*'
    'bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.*'
    # 'bower_components/jquery-smooth-scroll/**/*.js'
  ])

  .pipe(gulp.dest(config.outputDir + '/scripts/vendor'))

  # Merge tasks and return stream
  merge js, vendor

#
# Task: Images
#
gulp.task 'images', ->
  gulp.src(config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}')

  # Stop gulp from crashing on errors
  .pipe(plumber(config.plumber))

  # Checks output dir for changes
  .pipe(changed(config.outputDir))

  # Minify images (on production) 
  .pipe(gulpIf(config.production, imagemin()))

  .pipe(gulp.dest(config.outputDir))

  # Send out notification when done
  .pipe notify(message: 'Images task complete')

#
# Watcher
# =======
# =====
#

gulp.task 'watch', ->
  gulp.watch(config.sourceDir + '/**/*.pug', [ 'html' ]).on 'change', browserSync.reload
  gulp.watch config.sourceDir + '/scripts/**/*.js', [ 'scripts' ]
  gulp.watch config.sourceDir + '/**/*.{jpg,png,svg,ico,gif}', [ 'images' ]
  gulp.watch config.sourceDir + '/styles/**/*.{scss,sass}', [
    'styles'
  ]
  gulp.watch config.sourceDir + '/fonts/**/*', [ 'fonts' ]
  return

# Gulp restart when gulpfile.js or config.js files are changed
spawn = require('child_process').spawn
gulp.task 'watch:gulp', ->
  p = undefined
  gulp.watch [
    'gulpfile.coffee'
  ], ->
    if p
      p.kill()
    p = spawn('gulp', [ 'build' ], stdio: 'inherit')
    return
  return

# Development Server
gulp.task 'serve', [ 'build' ], (done) ->
  browserSync.init {
    open: false
    port: 9000
    server: config.outputDir
  }, done
  return

# Build
gulp.task 'build', [ 'clean' ], ->
  gulp.start [
    'html'
    'scripts'
    'images'
    'styles'
    'fonts'
  ]

# Default task
gulp.task 'default', [
  'serve'
  'watch'
  'watch:gulp'
]