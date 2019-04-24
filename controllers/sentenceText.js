const SentenceText = require('../models/SentenceText');
const User = require('../models/User');
//tao sentenceText(co the bo di)
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
            if(req.user.texts.length ==0){
                const sentenceTextFound = await SentenceText.find({ userEmail: null }).limit(10);
                sentenceTextFound.map(text => (
                    text.userEmail = req.user.email,
                    text.save((err) => {
                        if (err) {
                            res.render('error', {
                                title: 'Lỗi',
                                message: err
                            })
                        }
                    })
                ))
                req.user.texts.push(sentenceTextFound);
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
            }
            else{
                res.render('error', {
                    title: 'Lỗi',
                    message: "Xin lỗi bạn đã làm rồi"
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

//xoa bo thong tin sentence de test lai(co the bo)
exports.removeUserSentenceText = async (req, res, next) => {
    const s = await SentenceText.find({});
    s.map(s => (

        s.userChoose = null,
        s.userEmail = null,
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
//report cau sai chinh ta
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
//khieu nai admin cham status
exports.reportCheckresult = async (req, res, next) => {
    let {textid}=req.body;
    if (req.user) {
        try {
            const sentenceText = await SentenceText.findById(textid);
            sentenceText.userReportCheckResult = true;
            
                sentenceText.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                });
            

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
// kiem tra ket qua status
exports.checkresult =async (req, res, next) => {
const {user} = req.params;
let sentencesText;

    if(req.user){
try {
    if(user){
         sentencesText= await SentenceText.aggregate().match({
            $and: [{
              userEmail: user
            }, {
              $or: [{
                status: "ban"
              }, {
                status: "approve"
              }]
            }]
          })
          var count = {
            ban: 0,
            approve: 0
          };
          for (var i = 0; i < sentencesText.length; ++i) {
            count[sentencesText[i].status]++;
          }
    }
   
   res.render('checkresultText', {
    title: 'Kiem tra',
    texts: sentencesText,
    total: sentencesText.length,
    userEmail:user,
    number_of_bans: count.ban,
    number_of_approves: count.approve
     
})
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

//cham diem status
exports.summary = async (req, res, next) => {
    let sentencesText,UserText,userEmail,user;
    if (req.user) {

        if (req.user.rank === "Admin") {
            if (!req.params.email) {
                UserText = await SentenceText.aggregate(([{ $group: { _id: "$userEmail" } }]));
                userEmail=await  UserText.map(useremail => (
                    useremail._id
                ))
                 user = await User.find({ email : { $in : userEmail } });
               
              

            }
            else {
                
                sentencesText = await SentenceText.find({ userEmail: req.params.email })
            
                
            }

        }
        else {
          
            sentencesText = await SentenceText.find({ userEmail: req.user.email })
          
        }
        
        console.log("sentencesText",sentencesText);
        
        res.render('summaryText', {
            title: 'Thống kê',
            texts: sentencesText,
            byUser: req.user,
            User:user,
            userEmail: req.params.email
        })
    }
    else {
        res.redirect("/login");
    }
}
// admin cham diem user
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