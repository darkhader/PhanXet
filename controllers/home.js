/**
 * GET /
 * Home page.
 */
const Sentence = require('../models/Sentence');
const crypto = require('crypto');
exports.index = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  if (req.user.active) {
    if (req.user.missingInfos()) {
      res.render('home/missinginfo', {
        title: 'Trang chủ'
      });
    } else if (req.user.trialCompleted()) {
      res.render('home/trialcompleted', {
        title: 'Trang chủ'
      });
    } else if (req.user.rank == 'Failure') {
      res.render('home/disqualified', {
        title: 'Trang chủ'
      });
    } else {
      if (req.user.currentSentence) {
        Sentence.findById(req.user.currentSentence, (err, s) => {
          if (err) {
            res.render('error', {
              title: 'Lỗi',
              message: err
            });
          }
          if (s) {
            res.render('home/main', {
              title: 'Trang chủ',
              sentence: s,
              fileName: crypto.createHash('md5').update(s._id.toString() + process.env.UPLOAD_SALT).digest('hex')
            });
          } else {
            res.render('home/getnew', {
              title: 'Trang chủ',
              userType: req.user.rank
            });
          }
        });
      }     
      else {
        res.render('home/getnew', {
          title: 'Trang chủ',
          userType: req.user.rank
        });
      }
    }
  } else {
    res.render('home/notactive', {
      title: 'Trang chủ'
    });
  }
};
