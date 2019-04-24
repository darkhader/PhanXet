const SentenceText = require('../models/SentenceText');
const User = require('../models/User');
//tao sentenceText
exports.createSentenceText = (req, res) => {
    //   if (req.query && req.query.password == insertPassword) {
    if (true) {
        // var lineReader = require('readline').createInterface({
        //   input: require('fs').createReadStream('/starter/data_renormText.txt')
        // });

        // lineReader.on('line', function(line) {
        var sentenceText = new SentenceText({
            text: req.body.text,

            createdAt: new Date()
        });

        sentenceText.save((err) => {
            if (err) {
                res.render('error', {
                    title: 'Lỗi',
                    mesage: err
                })
            }
        });
        // });
    } else {
        res.render('error', {
            title: 'Lỗi',
            message: "Không dễ thế đâu, hơ hơ!"
        });
    }
};
//lay sentecentext
exports.get10SentenceText = async (req, res, next) => {
    if (req.user) {
        try {
            const sentenceTextFound = await SentenceText.find({ userID: null }).limit(10);
            sentenceTextFound.map(text => (
                text.userID = req.user._id,
                text.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                })
            ))
            req.user.save((err) => {
                if (err) {
                    res.render('error', {
                        title: 'Lỗi',
                        message: err
                    })
                }
            })
            res.render('home/mainText10', {
                title: 'Danh gia',
                TenCurrentSentenceText: sentenceTextFound
            })
        } catch (error) {
            res.render('error', {
                title: 'Lỗi',
                message: error
            });
        }
    } else {
        res.redirect("/login");
    }
}

exports.getOneSentenceText = async (req, res, next) => {
    const { textid } = req.body;
    if (req.user) {
        try {
            const sentenceTextFound = await SentenceText.findById(textid);

            res.json(sentenceTextFound);
        } catch (error) {
            res.render('error', {
                title: 'Lỗi',
                message: error
            });
        }
    } else {
        res.redirect("/login");
    }
}
exports.removeUserSentenceText = async (req, res, next) => {
    const s = await SentenceText.find({});
    s.map(s => (

        s.userChoose = null,
        s.userID = null,
        s.save((err) => {
            if (err) {
                res.render('error', {
                    title: 'Lỗi',
                    message: err
                })
            }

        })
    ))

}
//danh gia sentencetext 
exports.judgeSentenceText = async (req, res, next) => {
    const { textid, answer } = req.body;
    if (req.user) {
        try {
            const sentenceText = await SentenceText.findByIdAndUpdate(textid);
            if (req.user._id.toString() === sentenceText.userChoose) {
                return;
            }
            else {
                sentenceText.picks += 1;
                sentenceText.answer = answer;
                sentenceText.updatedAt = new Date();
                sentenceText.userChoose = req.user._id.toString();
                req.user.statistics.number_of_sentenceTexts += 1;
                sentenceText.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                    res.json(sentenceText)
                });
                req.user.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                })
            }

        } catch (error) {
            res.render('error', {
                title: 'Lỗi',
                message: error
            });
        }
    }
    else {
        res.redirect("/login");
    }
}

exports.report = async (req, res, next) => {
    const { textid } = req.body;
    if (req.user) {
        try {
            const sentenceText = await SentenceText.findByIdAndUpdate(textid);

            if (sentenceText.userReport === req.user._id.toString()) {


                return;
            }
            else {
                sentenceText.userReport = req.user._id.toString();
                sentenceText.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                });
            }

        } catch (error) {
            res.render('error', {
                title: 'Lỗi',
                message: error
            });
        }
    } else {
        res.redirect("/login");
    }
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
        }).exec(function (err, result) {
            if (err || !result) {
                res.render('error', {
                    title: 'Lỗi',
                    message: 'Không tồn tại user cần tìm'
                });
                return;
            } else {
                var userID = result._id.toString();
                SentenceText.aggregate().match({
                    $and: [{
                        userID: userID
                    }, {
                        $or: [{
                            status: "ban"
                        }, {
                            status: "approve"
                        }]
                    }]
                }).sort({
                    updatedAt: -1
                }).exec(function (err, result) {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: 'Có gì đó không đúng, thử lại sau xem sao'
                        });
                        return;
                    } else {

                        res.render('checkresultText', {
                            title: 'Tổng kết',
                            sentencesText: result,
                            userEmail: userEmail,
                        });
                        return;
                    }
                })
            };
        });
    }
}

exports.summary = async (req, res, next) => {
    let sentencesText,idUserText,userid,user;
    if (req.user) {

        if (req.user.rank === "Admin") {
            if (!req.params.email) {
                idUserText = await SentenceText.aggregate(([{ $group: { _id: "$userID" } }]));
                 userid=await  idUserText.map(userid => (
                    userid._id
                ))
                 user = await User.find({ _id : { $in : userid } });
               
              

            }
            else {
                
                sentencesText = await SentenceText.find({ userID: req.params.email })
                console.log("1");
                
            }

        }
        else {
          
            sentencesText = await SentenceText.find({ userID: req.user._id.toString() })
            console.log("2");
        }
        
        console.log("sentencesText ",sentencesText );
        res.render('summaryText', {
            title: 'Thống kê',
            texts: sentencesText,
            byUser: req.user,
            User:user  
        })
    }
    else {
        res.redirect("/login");
    }
}
exports.adminCheckSummary = async (req, res, next) => {
    const { status, textid } = req.body;
    if (req.user) {
        if (req.user.rank && req.user.rank == "Admin") {

            const sentencesText = await SentenceText.findById(textid)

            sentencesText.status = status;
            sentencesText.save((err) => {
                if (err) {
                    res.render('error', {
                        title: 'Lỗi',
                        message: err
                    })
                }
                res.json(sentencesText)
            });
        }




        else {
            res.redirect("/login");
        }
    }
    else {
        res.redirect("/login");
    }
}