const SentenceText = require('../models/SentenceText');
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
    const { textid,answer } = req.body;
    if (req.user) {
        try {
            const sentenceText = await SentenceText.findByIdAndUpdate(textid);
            if (req.user._id.toString() === sentenceText.userChoose) {
                return;
            }
            else {
                sentenceText.picks += 1;
                sentenceText[answer] += 1;
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
            const userID = sentenceText.userReport.some(text => text ===req.user._id.toString())
            if(userID){
             
                
                return;
            }
            else{
                sentenceText.userReport.push(req.user._id.toString());
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
