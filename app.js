/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const device = require('express-device');
const crypto = require('crypto');
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    if (file.mimetype == 'audio/wav') {
      var correctFileName = crypto.createHash('md5').update(req.user.currentSentence + process.env.UPLOAD_SALT).digest('hex');
      if (file.fieldname == correctFileName) {
        dir = path.join(__dirname, 'data/' + file.fieldname.substr(0, 1) + '/' + file.fieldname.substr(1, 1) + '/' + file.fieldname.substr(2, 1));
      } else {
        dir = path.join(__dirname, 'uploads/junks');
      }
    } else {
      dir = path.join(__dirname, 'uploads');
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    if (file.mimetype == 'audio/wav') {
      cb(null, file.fieldname + '.wav');
    } else {
      cb(null, file.fieldname);
    }
  }
});
const upload = multer({
  storage: storage
});
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({
  path: '.env'
});
/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const sentenceController = require('./controllers/sentence');
const sentenceTextController = require('./controllers/sentenceText');
/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');
/**
 * Create Express server.
 */
const app = express();
/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});
/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(device.capture({
  parseUserAgent: true
}));
app.use((req, res, next) => {
  if (req.device.type == 'phone' || req.device.type == 'tablet') {
    res.send("Mobile devices is not supported by our system");
  } else {
    next();
  }
});
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.raw({
  type: 'audio/wav',
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 1209600000
  }, // two weeks in milliseconds
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use((req, res, next) => {
//   if (req.path === '/api/upload') {
//     next();
//   } else {
//     lusca.csrf()(req, res, next);
//   }
// });
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user && req.path !== '/login' && req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user && (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 31557600000
}));
app.use('/data', express.static(path.join(__dirname, 'data'), {
  maxAge: 31557600000
}));
/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.post('/account/activate', passportConfig.isAuthenticated, userController.postActivate)
/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);
/**
 * OAuth authentication routes. (Sign in)
 */
// app.get('/auth/instagram', passport.authenticate('instagram'));
// app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
// app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/github', passport.authenticate('github'));
// app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
app.get('/auth/google', passport.authenticate('google', {
  scope: 'profile email'
}));
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
// app.get('/auth/twitter', passport.authenticate('twitter'));
// app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
// app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
/**
 * OAuth authorization routes. (API examples)
 */
// app.get('/auth/foursquare', passport.authorize('foursquare'));
// app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
//   res.redirect('/api/foursquare');
// });
// app.get('/auth/tumblr', passport.authorize('tumblr'));
// app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
//   res.redirect('/api/tumblr');
// });
// app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
// app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api' }), (req, res) => {
//   res.redirect(req.session.returnTo);
// });
// app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
// app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect('/api/pinterest');
// });
// app.get('/sentence/insert', sentenceController.insertSentence);
app.post('/sentence/assign', sentenceController.assignSentence);
app.post('/sentence/remove', sentenceController.removeSentence);
app.post('/sentence/upload', upload.any(), sentenceController.uploadSentence);
app.post('/candidate/update', userController.updateCandidate);
app.get('/summary/:user?/:page?', sentenceController.summary);
app.get('/detail/:user?/:time?', sentenceController.showDetail);
app.post('/detail/:user?/:time?', sentenceController.updateDetail);
app.get('/checkresult/:user?/:time?', sentenceController.checkresult);
app.get('/sentence/report/:action/:target', sentenceController.report);

// app.post('/sentenceText/assign', sentenceController.assignSentenceText);
app.post('/sentenceText/create', sentenceTextController.createSentenceText);
app.get('/sentenceText/getText/:sentenceTextId', sentenceTextController.getSentenceText);
app.get('/sentenceText/get', sentenceTextController.get10SentenceText);
app.get('/sentenceText/randomText/:sentenceTextId', homeController.textIndex);
app.post('/sentenceText/remove', sentenceTextController.removeSentenceText);
app.put('/sentenceText/judge/:sentenceTextId', sentenceTextController.judgeSentenceText);
app.get('/sentenceText/remove', sentenceTextController.removeUserSentenceText);

//app.post('/sentenceText/remove', sentenceTextController.removeSentenceText);
// app.post('/sentenceText/upload', upload.any(), sentenceTextController.uploadSentenceText);
// app.post('/candidate/update', userController.updateCandidate);
// app.get('/summary/:user?/:page?', sentenceTextController.summary);
// app.get('/detail/:user?/:time?', sentenceTextController.showDetail);
// app.post('/detail/:user?/:time?', sentenceTextController.updateDetail);
// app.get('/checkresult/:user?/:time?', sentenceTextController.checkresult);
app.get('/sentenceText/report/:sentenceTextId', sentenceTextController.report);


// app.get('/user/insert', userController.insertUsers);
/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}
/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});
module.exports = app;