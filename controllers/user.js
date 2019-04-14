const {
  promisify
} = require('util');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const randomBytesAsync = promisify(crypto.randomBytes);
/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};
/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({
    gmail_remove_dots: false
  });
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {
        msg: 'Success! You are logged in.'
      });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};
/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    if (err) console.log('Error : Failed to destroy the session during logout.', err);
    req.user = null;
    res.redirect('/');
  });
};
/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};
/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({
    gmail_remove_dots: false
  });
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }
  const user = new User({
    email: req.body.email,
    password: req.body.password
  });
  User.findOne({
    email: req.body.email
  }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.'
      });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
};
/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management'
  });
};
/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  // req.assert('email', 'Please enter a valid email address.').isEmail();
  // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    // user.email = req.body.email || '';
    // user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.accent = req.body.accent || '';
    user.profile.year_of_birth = req.body.year_of_birth || '';
    user.profile.bankAccountHolder = req.body.bankAccountHolder || '';
    user.profile.bankAccountNumber = req.body.bankAccountNumber || '';
    user.profile.bankAccountBank = req.body.bankAccountBank || '';
    user.profile.bankAccountBranch = req.body.bankAccountBranch || '';
    // user.profile.website = req.body.website || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', {
            msg: 'Địa chỉ email đã có người sử dụng.'
          });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', {
        msg: 'Thông tin cá nhân đã được cập nhật.'
      });
      res.redirect('/account');
    });
  });
};
/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {
        msg: 'Password has been changed.'
      });
      res.redirect('/account');
    });
  });
};
/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({
    _id: req.user.id
  }, (err) => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash('info', {
      msg: 'Your account has been deleted.'
    });
    res.redirect('/');
  });
};
/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const {
    provider
  } = req.params;
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('info', {
        msg: `${provider} account has been unlinked.`
      });
      res.redirect('/account');
    });
  });
};
/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User.findOne({
    passwordResetToken: req.params.token
  }).where('passwordResetExpires').gt(Date.now()).exec((err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('errors', {
        msg: 'Password reset token is invalid or has expired.'
      });
      return res.redirect('/forgot');
    }
    res.render('account/reset', {
      title: 'Password Reset'
    });
  });
};
/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }
  const resetPassword = () => User.findOne({
    passwordResetToken: req.params.token
  }).where('passwordResetExpires').gt(Date.now()).then((user) => {
    if (!user) {
      req.flash('errors', {
        msg: 'Password reset token is invalid or has expired.'
      });
      return res.redirect('back');
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    return user.save().then(() => new Promise((resolve, reject) => {
      req.logIn(user, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(user);
      });
    }));
  });
  const sendResetPasswordEmail = (user) => {
    if (!user) {
      return;
    }
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Your Hackathon Starter password has been changed',
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    return transporter.sendMail(mailOptions).then(() => {
      req.flash('success', {
        msg: 'Success! Your password has been changed.'
      });
    });
  };
  resetPassword().then(sendResetPasswordEmail).then(() => {
    if (!res.finished) res.redirect('/');
  }).catch(err => next(err));
};
/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};
/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({
    gmail_remove_dots: false
  });
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }
  const createRandomToken = randomBytesAsync(16).then(buf => buf.toString('hex'));
  const setRandomToken = token => User.findOne({
    email: req.body.email
  }).then((user) => {
    if (!user) {
      req.flash('errors', {
        msg: 'Account with that email address does not exist.'
      });
    } else {
      user.passwordResetToken = token;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      user = user.save();
    }
    return user;
  });
  const sendForgotPasswordEmail = (user) => {
    if (!user) {
      return;
    }
    const token = user.passwordResetToken;
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Reset your password on Hackathon Starter',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    return transporter.sendMail(mailOptions).then(() => {
      req.flash('info', {
        msg: `An e-mail has been sent to ${user.email} with further instructions.`
      });
    });
  };
  createRandomToken.then(setRandomToken).then(sendForgotPasswordEmail).then(() => res.redirect('/forgot')).catch(next);
};
exports.postActivate = (req, res, next) => {
  if (req.isAuthenticated()) {
    var correctCode = crypto.createHash('md5').update(req.user.email + process.env.ACTIVATION_SALT).digest('hex').substr(0, 8).toUpperCase();
    if (req.body.activation_code == correctCode) {
      req.user.active = true;
      req.user.save((err) => {
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
};
exports.updateCandidate = (req, res) => {
  if (!req.user || req.user.rank != 'Admin') {
    res.render('error', {
      title: 'Nghịch vừa thôi',
      mesage: err
    });
  } else {
    var decision = req.body.decision;
    var candidate = req.body.candidate;
    User.findOne({
      email: candidate
    }, (err, result) => {
      if (err) {
        res.render('error', {
          title: 'Nghịch vừa thôi',
          mesage: err
        });
      } else {
        switch (decision) {
          case 'select':
            result.rank = 'Worker';
            break;
          case 'discard':
          default:
            result.rank = 'Failure';
            break;
        }
        result.save((err) => {
          if (err) {
            res.render('error', {
              title: 'Nghịch vừa thôi',
              mesage: err
            });
          } else {
            res.redirect('/');
          }
        })
      }
    })
  }
}
// exports.insertUsers = (req, res) => {
//   if (req.query && req.query.password == 'luopei3iJugu') {
//     var faker = require('faker');
//     faker.locale = "vi";
//     var user;
//     for (var i = 0; i < 1; ++i) {
//       user = new User({
//         email: faker.internet.email(),
//         profile: {
//           name: faker.name.findName(),
//         },
//         active: Math.random() >= 0.5
//       });
//       user.save((err) => {
//         if (err) {
//           res.render('error', {
//             title: 'Lỗi',
//             mesage: err
//           })
//         }
//       });
//     }
//     res.redirect('/');
//   } else {
//     res.render('error', {
//       title: 'Lỗi',
//       message: "Không dễ thế đâu, hơ hơ!"
//     });
//   }
// };