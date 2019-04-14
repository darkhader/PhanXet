const Sentence = require('../models/Sentence');
const User = require('../models/User');
const DetailDailyCache = require('../models/DetailDailyCache');
const crypto = require('crypto');
const fs = require('fs');
const insertPassword = 'luopei3iJugu';
const price_per_second = 55;
var mongoose = require('mongoose');
exports.insertSentence = (req, res) => {
  if (req.query && req.query.password == insertPassword) {
    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream('/starter/data_renorm.txt')
    });
    var count = 0;
    var duration = function(s) {
      return s.trim().split(" ").length / 4;
    }
    lineReader.on('line', function(line) {
      var sentence = new Sentence({
        text: line,
        maxDuration: duration(line),
        createdAt: new Date()
      });
      sentence.save((err) => {
        if (err) {
          res.render('error', {
            title: 'Lỗi',
            mesage: err
          })
        }
      });
    });
  } else {
    res.render('error', {
      title: 'Lỗi',
      message: "Không dễ thế đâu, hơ hơ!"
    });
  }
};
exports.assignSentence = (req, res, next) => {
  if (req.user) {
    if (req.user.currentSentence) {
      res.render('error', {
        title: 'Lỗi',
        message: "Vẫn đang có nội dung chưa đọc mà, lấy câu nữa làm gì?"
      });
    } else {
      var r = [Math.random(), Math.random()];
      if (r[0] > r[1]) {
        r.reverse();
      }
      Sentence.findOne({
        userID: null,
        random: {
          $gte: r[0],
          $lte: r[1]
        }
      }).exec((err, sentence) => {
        if (err) {
          res.render('error', {
            title: 'Lỗi',
            message: err
          })
        }
        if (sentence) {
          sentence.picks += 1;
          sentence.userID = req.user._id;
          sentence.owner_info.accent = req.user.profile.accent;
          sentence.owner_info.gender = req.user.profile.gender;
          sentence.owner_info.year_of_birth = req.user.profile.year_of_birth;
          sentence.updatedAt = new Date();
          req.user.currentSentence = sentence._id;
          req.user.statistics.number_of_sentences += 1;
          req.user.statistics.total_duration += sentence.maxDuration;
          sentence.save((err) => {
            if (err) {
              res.render('error', {
                title: 'Lỗi',
                message: err
              })
            }
            req.user.save((err) => {
              if (err) {
                res.render('error', {
                  title: 'Lỗi',
                  message: err
                })
              }
              res.redirect('/');
            })
          });
        } else {
          res.render('error', {
            title: 'Lỗi',
            message: "Đã hết nội dung để đọc. Hệ thống sẽ thêm nội dung mới trong thời gian sớm nhất"
          });
        }
      });
    }
  } else {
    res.redirect("/login");
  }
}
exports.removeSentence = (req, res, next) => {
  if (req.user) {
    if (!req.user.currentSentence) {
      res.render('error', {
        message: "Có câu nào đâu mà bỏ? Quay lại đi."
      });
    } else {
      Sentence.findById(req.user.currentSentence, (err, s) => {
        if (err) {
          res.render('error', {
            title: 'Lỗi',
            message: err
          })
        }
        req.user.currentSentence = undefined;
        req.user.statistics.number_of_sentences -= 1;
        req.user.statistics.total_duration -= s.maxDuration;
        s.owner_info.userID = undefined;
        s.owner_info.accent = undefined;
        s.owner_info.gender = undefined;
        s.year_of_birth = undefined;
        s.userID = null;
        s.updatedAt = new Date();
        s.save((err) => {
          if (err) {
            res.render('error', {
              title: 'Lỗi',
              message: err
            })
          }
          req.user.save((err) => {
            if (err) {
              res.render('error', {
                title: 'Lỗi',
                message: err
              })
            }
            res.redirect("/");
          })
        })
      })
    }
  } else {
    res.redirect("/login");
  }
}
exports.uploadSentence = (req, res, next) => {
  if (req.user) {
    if (req.files.length > 1) {
      // Something is wrong here
      req.files.forEach((file) => {
        unlinkSync(file.path);
      });
      res.json({
        error: true
      });
    } else if (req.files.length == 0) {
      res.json({
        error: true
      });
    } else {
      var correctFileName = crypto.createHash('md5').update(req.user.currentSentence + process.env.UPLOAD_SALT).digest('hex');
      if (req.files[0].fieldname && req.files[0].fieldname == correctFileName) {
        req.user.currentSentence = undefined;
        req.user.save((err) => {
          if (err) {
            res.json({
              error: true
            });
          }
          res.json({
            upload: "done"
          });
        })
      } else {
        // Not the correctID
        if (req.files[0].fieldname && req.files[0].fieldname) {
          fs.unlinkSync(req.files[0].fieldname)
        }
        res.json({
          error: true
        });
      }
    }
  } else {
    res.redirect("/login");
  }
}
exports.summary = (req, res, next) => {
  function collectData(matchCondition) {
    Sentence.aggregate().match(matchCondition).sort({
      updatedAt: -1
    }).facet({
      metadata: [{
        $group: {
          _id: null,
          actualduration: {
            $sum: "$duration"
          },
          maximumduration: {
            $sum: "$maxDuration"
          },
          totalnumber: {
            $sum: 1
          }
        }
      }],
      data: [{
        $skip: (perPage * page) - perPage
      }, {
        $limit: perPage
      }]
    }).exec(function(err, result) {
      if (err) {
        res.render('error', {
          title: 'Lỗi',
          message: 'Không hiển thị được các câu bạn đã làm, phiền bạn thử lại lúc khác nhé.'
        });
      } else {
        var total;
        try {
          total = result[0].metadata[0].totalnumber;
        } catch (e) {
          total = 0
        }
        var sentences = result[0].data;
        var maximumduration;
        try {
          maximumduration = result[0].metadata[0].maximumduration;
        } catch (e) {
          maximumduration = 0;
        }
        res.render('summary', {
          title: 'Tổng kết',
          byUser: byUser,
          pages: Math.ceil(total / perPage),
          current: page,
          sentences: sentences,
          total: total,
          maximumduration: maximumduration.toFixed(2),
          price_per_second: price_per_second,
          viewer: req.user
        });
      }
    });
  }
  if (!req.user) {
    res.render('error', {
      title: 'Lỗi',
      message: 'Đăng nhập đã nào'
    });
  } else {
    var byUser;
    var perPage = 20;
    var page = parseInt(req.params.page) || 1;
    if (!req.params.user || req.params.user == 'self') {
      byUser = req.user;
      byUser.navigator = 'self';
      var userID = req.user._id.toString();
      var currentSentence = req.user.currentSentence;
      var matchCondition = {
        userID: userID,
        updatedAt: {
          $lt: new Date('2018-10-01'),
          $gte: new Date('2018-09-01')
        }
      };
      if (currentSentence) {
        matchCondition._id = {
          $ne: mongoose.Types.ObjectId(currentSentence)
        }
      };
      collectData(matchCondition);
    } else {
      if (req.user.rank && req.user.rank == "Admin") {
        User.findOne({
          email: req.params.user
        }).exec(function(err, result) {
          if (err || !result) {
            res.render('error', {
              title: 'Lỗi',
              message: 'Không tồn tại user cần tìm'
            });
            return;
          } else {
            byUser = result;
            byUser.navigator = result.email;
            var currentSentence = result.currentSentence;
            var matchCondition = {
              userID: result._id.toString(),
              updatedAt: {
                $lt: new Date('2018-10-01'),
                $gte: new Date('2018-09-01')
              }
            };
            if (currentSentence) {
              matchCondition._id = {
                $ne: mongoose.Types.ObjectId(currentSentence)
              }
            };
            collectData(matchCondition);
          }
        });
      } else {
        res.render('error', {
          title: 'Lỗi',
          message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
        });
        return;
      }
    }
  }
}
exports.report = (req, res, next) => {
  if (req.user) {
    var action = req.params.action;
    var target = req.params.target;
    Sentence.findById(target, (err, s) => {
      if (err) {
        res.json({
          error: true
        });
      } else {
        var author = s.userID;
        if (s.status) {
          res.json({
            error: true
          });
          return;
        }
        if (req.user.rank == "Worker" || req.user.rank == "Trial") {
          if (action != "trash" && action != "clear") {
            res.json({
              error: true
            });
            return;
          }
          if (req.user._id != author) {
            res.json({
              error: true
            });
            return;
          }
        } else if (req.user.rank == "Admin") {
          if (action != "ban" && action != "approve") {
            res.json({
              error: true
            });
            return;
          }
        } else {
          res.json({
            error: true
          });
          return;
        }
        s.status = action;
        s.save((err) => {
          if (err) {
            res.json({
              error: true
            });
          } else {
            res.json({
              success: true
            });
          }
        })
      }
    })
  } else {
    res.json({
      error: true
    });
  }
}
exports.showDetail = (req, res, next) => {
  if (!req.user) {
    res.render('error', {
      title: 'Lỗi',
      message: 'Đăng nhập đã nào'
    });
  } else {
    var userEmail;
    var timeStart, timeEnd;
    if (!req.params.time) {
      timeStart = new Date("2018-09-01");
      timeEnd = new Date("2018-10-01");
    } else if (req.params.time == '08') {
      timeStart = new Date("2018-08-01");
      timeEnd = new Date("2018-09-01");
    } else if (req.params.time == '09') {
      timeStart = new Date("2018-09-01");
      timeEnd = new Date("2018-10-01");
    }
    if (!req.params.user) {
      userEmail = req.user.email;
    } else if (req.user.email == req.params.user) {
      userEmail = req.params.user;
    } else {
      if (req.user.rank && req.user.rank == "Admin") {
        userEmail = req.params.user;
      } else {
        res.render('error', {
          title: 'Lỗi',
          message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
        });
        return;
      }
    }
    User.findOne({
      email: userEmail
    }).exec(function(err, result) {
      if (err || !result) {
        res.render('error', {
          title: 'Lỗi',
          message: 'Không tồn tại user cần tìm'
        });
        return;
      } else {
        var userID = result._id.toString();
        DetailDailyCache.find({
          $and: [{
            day: {
              $gte: timeStart,
              $lt: timeEnd
            }
          }, {
            userID: userID
          }]
        }).sort({
          day: 1
        }).exec((e, r) => {
          if (e || !r) {
            res.render('error', {
              title: 'Lỗi',
              message: 'Không tìm được lịch sử chi tiết'
            });
            return;
          } else {
            var totalValidTime = 0;
            r.forEach((day) => {
              if (day.validDuration && day.validDuration > 3600) {
                totalValidTime += 3600;
              } else
              if (day.validDuration) {
                totalValidTime += day.validDuration;
              }
            })
            res.render('detail', {
              title: 'Thống kê chi tiết',
              total: totalValidTime,
              days: r,
              userEmail: userEmail
            });
            return;
          }
        })
      }
    });
  }
}
exports.updateDetail = (req, res, next) => {
  function extractSentencesInformation(sentences) {
    var map = {};
    sentences.forEach((s) => {
      var day = s.updatedAt;
      day = new Date(day - day % 86400000)
      if (!map[day]) {
        map[day] = {
          totalDuration: 0,
          clearedDuration: 0,
          trashedDuration: 0,
          validDuration: 0
        }
      }
      map[day].totalDuration += s.maxDuration;
      if (s.status == "clear") {
        map[day].clearedDuration += s.maxDuration;
      } else
      if (s.status == "trash") {
        map[day].trashedDuration += s.maxDuration;
      } else {
        map[day].validDuration += s.maxDuration;
      }
    });
    var result = [];
    var data;
    for (var key in map) {
      if (key) {
        data = map[key];
        data.day = new Date(key);
        result.push(data);
      }
    }
    return result;
  };
  if (!req.user) {
    res.render('error', {
      title: 'Lỗi',
      message: 'Đăng nhập đã nào'
    });
  } else {
    var userEmail;
    var timeStart, timeEnd;
    if (!req.params.time) {
      timeStart = new Date("2018-09-01");
      timeEnd = new Date("2018-10-01");
    } else if (req.params.time == '08') {
      timeStart = new Date("2018-08-01");
      timeEnd = new Date("2018-09-01");
    } else if (req.params.time == '09') {
      timeStart = new Date("2018-09-01");
      timeEnd = new Date("2018-10-01");
    }
    if (!req.params.user) {
      userEmail = req.user.email;
    } else if (req.user.email == req.params.user) {
      userEmail = req.params.user;
    } else {
      if (req.user.rank && req.user.rank == "Admin") {
        userEmail = req.params.user;
      } else {
        res.render('error', {
          title: 'Lỗi',
          message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
        });
        return;
      }
    }
    User.findOne({
      email: userEmail
    }).exec(function(err, result) {
      if (err || !result) {
        res.render('error', {
          title: 'Lỗi',
          message: 'Không tồn tại user cần tìm'
        });
        return;
      } else {
        var userID = result._id.toString();
        Sentence.find({
          $and: [{
            updatedAt: {
              $gte: timeStart,
              $lt: timeEnd
            }
          }, {
            userID: userID
          }]
        }).exec(function(e, sentences) {
          if (e) {
            res.render('error', {
              title: 'Lỗi',
              message: 'User này chẳng có câu nào trong khoảng thời gian cần xét cả'
            });
            return;
          } else {
            var sentencesInformation = extractSentencesInformation(sentences);
            sentencesInformation.forEach((d) => {
              d.userID = userID;
              DetailDailyCache.findOneAndUpdate({
                day: d.day,
                userID: userID
              }, {
                $set: d
              }, {
                upsert: true
              }, (e, r) => {
                if (e) {
                  res.render('error', {
                    title: 'Lỗi',
                    message: 'Lỗi không update đưọc cache'
                  });
                  return;
                } else {}
              })
            });
            res.redirect(req.get('referer'));
            return;
          }
        });
      }
    });
  };
}
exports.checkresult = (req, res, next) => {
  if (!req.user) {
    res.render('error', {
      title: 'Lỗi',
      message: 'Đăng nhập đã nào'
    });
  } else {
    var userEmail;
    var timeStart, timeEnd;
    if (!req.params.time) {
      timeStart = new Date("2018-09-01");
      timeEnd = new Date("2018-10-01");
    } else if (req.params.time == '08') {
      timeStart = new Date("2018-08-01");
      timeEnd = new Date("2018-09-01");
    } else if (req.params.time == '09') {
      timeStart = new Date("2018-09-01");
      timeEnd = new Date("2018-10-01");
    }
    if (!req.params.user) {
      userEmail = req.user.email;
    } else {
      if (req.user.rank && req.user.rank == "Admin") {
        userEmail = req.params.user;
      } else if (req.user.email == req.params.user) {
        userEmail = req.params.user;
      } else {
        res.render('error', {
          title: 'Lỗi',
          message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
        });
        return;
      }
    }
    User.findOne({
      email: userEmail
    }).exec(function(err, result) {
      if (err || !result) {
        res.render('error', {
          title: 'Lỗi',
          message: 'Không tồn tại user cần tìm'
        });
        return;
      } else {
        var userID = result._id.toString();
        Sentence.aggregate().match({
          $and: [{
            userID: userID
          }, {
            updatedAt: {
              $gte: timeStart,
              $lt: timeEnd,
            }
          }, {
            $or: [{
              status: "ban"
            }, {
              status: "approve"
            }]
          }]
        }).sort({
          updatedAt: -1
        }).exec(function(err, result) {
          if (err) {
            res.render('error', {
              title: 'Lỗi',
              message: 'Có gì đó không đúng, thử lại sau xem sao'
            });
            return;
          } else {
            var count = {
              ban: 0,
              approve: 0
            };
            for (var i = 0; i < result.length; ++i) {
              count[result[i].status]++;
            }
            res.render('checkresult', {
              title: 'Tổng kết',
              sentences: result,
              total: result.length,
              userEmail: userEmail,
              number_of_bans: count.ban,
              number_of_approves: count.approve
            });
            return;
          }
        })
      };
    });
  }
}