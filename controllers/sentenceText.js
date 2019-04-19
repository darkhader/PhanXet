const SentenceText = require('../models/SentenceText');
const User = require('../models/User');
const DetailDailyCache = require('../models/DetailDailyCache');
const crypto = require('crypto');
const fs = require('fs');
const insertPassword = 'luopei3iJugu';
const price_per_second = 55;
var mongoose = require('mongoose');

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
       
            
         const  sentenceTextFound = await SentenceText.find({userID : null}).limit(10); 
                
              

                    
                  
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

                    res.render('home/mainText10' , {
                        title: 'Danh gia',
                        TenCurrentSentenceText: sentenceTextFound
                        
                      })
                  
                
                      
            
   



    } else {
        res.redirect("/login");
    }
}
exports.getSentenceText = async (req, res, next) => {
    const { sentenceTextId } = req.params;

    if (req.user) {
        
            
        const  sentenceTextFound= await  SentenceText.findById(sentenceTextId)
      
        res.render('home/text' , {
            title: 'chi tiet',
            SentenceText: sentenceTextFound
            
          })


    } else {
        res.redirect("/login");
    }
}
exports.getOneSentenceText = async (req, res, next) => {
    const { sentenceTextId } = req.params;

    if (req.user) {
        
            
        const  sentenceTextFound= await  SentenceText.findById(sentenceTextId);
      
        res.json(sentenceTextFound);


    } else {
        res.redirect("/login");
    }
}
exports.removeUserSentenceText = async (req, res, next) => {
    const s = await SentenceText.find({});
    s.map( s => (
        
        s.userChoose=null,
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
    const { sentenceTextId } = req.params;
    const { answer } = req.body;
   
    
    if (req.user) {



        try {
            const sentenceText = await SentenceText.findByIdAndUpdate(sentenceTextId);
           
           
            if (req.user._id.toString() === sentenceText.userChoose) {
              
               return;
            }
            else {
                sentenceText.picks += 1;
                sentenceText[answer] += 1;
                sentenceText.updatedAt = new Date();
                sentenceText.userChoose= req.user._id.toString();
                req.user.statistics.number_of_sentenceTexts += 1;

                sentenceText.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                });
                req.user.save((err) => {
                    if (err) {
                        res.render('error', {
                            title: 'Lỗi',
                            message: err
                        })
                    }
                    res.redirect('/');
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
    const { sentenceTextId } = req.params;
    if (req.user) {

        const sentenceText = await SentenceText.findByIdAndUpdate(sentenceTextId);
        sentenceText.userReport.push(req.user._id.toString())  ;
       
        
        sentenceText.save((err) => {
            if (err) {
                res.render('error', {
                    title: 'Lỗi',
                    message: err
                })
            }
        });
        
    } else {
        res.redirect("/login");
    }
}
exports.removeSentenceText = (req, res, next) => {
    if (req.user) {
        if (!req.user.currentSentenceText) {
            res.render('error', {
                message: "Có câu nào đâu mà bỏ? Quay lại đi."
            });
        } else {
            SentenceText.findById(req.user.currentSentenceText, (err, s) => {
                if (err) {
                    res.render('error', {
                        title: 'Lỗi',
                        message: err
                    })
                }
                req.user.currentSentenceText = undefined;
                req.user.statistics.number_of_sentenceTexts -= 1;



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


// exports.summary = (req, res, next) => {
//     function collectData(matchCondition) {
//         SentenceText.aggregate().match(matchCondition).sort({
//             updatedAt: -1
//         }).facet({
//             metadata: [{
//                 $group: {
//                     _id: null,
//                     actualduration: {
//                         $sum: "$duration"
//                     },
//                     maximumduration: {
//                         $sum: "$maxDuration"
//                     },
//                     totalnumber: {
//                         $sum: 1
//                     }
//                 }
//             }],
//             data: [{
//                 $skip: (perPage * page) - perPage
//             }, {
//                 $limit: perPage
//             }]
//         }).exec(function (err, result) {
//             if (err) {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Không hiển thị được các câu bạn đã làm, phiền bạn thử lại lúc khác nhé.'
//                 });
//             } else {
//                 var total;
//                 try {
//                     total = result[0].metadata[0].totalnumber;
//                 } catch (e) {
//                     total = 0
//                 }
//                 var sentenceTexts = result[0].data;
//                 var maximumduration;
//                 try {
//                     maximumduration = result[0].metadata[0].maximumduration;
//                 } catch (e) {
//                     maximumduration = 0;
//                 }
//                 res.render('summary', {
//                     title: 'Tổng kết',
//                     byUser: byUser,
//                     pages: Math.ceil(total / perPage),
//                     current: page,
//                     sentenceTexts: sentenceTexts,
//                     total: total,
//                     maximumduration: maximumduration.toFixed(2),
//                     price_per_second: price_per_second,
//                     viewer: req.user
//                 });
//             }
//         });
//     }
//     if (!req.user) {
//         res.render('error', {
//             title: 'Lỗi',
//             message: 'Đăng nhập đã nào'
//         });
//     } else {
//         var byUser;
//         var perPage = 20;
//         var page = parseInt(req.params.page) || 1;
//         if (!req.params.user || req.params.user == 'self') {
//             byUser = req.user;
//             byUser.navigator = 'self';
//             var userID = req.user._id.toString();
//             var currentSentenceText = req.user.currentSentenceText;
//             var matchCondition = {
//                 userID: userID,
//                 updatedAt: {
//                     $lt: new Date('2018-10-01'),
//                     $gte: new Date('2018-09-01')
//                 }
//             };
//             if (currentSentenceText) {
//                 matchCondition._id = {
//                     $ne: mongoose.Types.ObjectId(currentSentenceText)
//                 }
//             };
//             collectData(matchCondition);
//         } else {
//             if (req.user.rank && req.user.rank == "Admin") {
//                 User.findOne({
//                     email: req.params.user
//                 }).exec(function (err, result) {
//                     if (err || !result) {
//                         res.render('error', {
//                             title: 'Lỗi',
//                             message: 'Không tồn tại user cần tìm'
//                         });
//                         return;
//                     } else {
//                         byUser = result;
//                         byUser.navigator = result.email;
//                         var currentSentenceText = result.currentSentenceText;
//                         var matchCondition = {
//                             userID: result._id.toString(),
//                             updatedAt: {
//                                 $lt: new Date('2018-10-01'),
//                                 $gte: new Date('2018-09-01')
//                             }
//                         };
//                         if (currentSentenceText) {
//                             matchCondition._id = {
//                                 $ne: mongoose.Types.ObjectId(currentSentenceText)
//                             }
//                         };
//                         collectData(matchCondition);
//                     }
//                 });
//             } else {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
//                 });
//                 return;
//             }
//         }
//     }
// }


// exports.showDetail = (req, res, next) => {
//     if (!req.user) {
//         res.render('error', {
//             title: 'Lỗi',
//             message: 'Đăng nhập đã nào'
//         });
//     } else {
//         var userEmail;
//         var timeStart, timeEnd;
//         if (!req.params.time) {
//             timeStart = new Date("2018-09-01");
//             timeEnd = new Date("2018-10-01");
//         } else if (req.params.time == '08') {
//             timeStart = new Date("2018-08-01");
//             timeEnd = new Date("2018-09-01");
//         } else if (req.params.time == '09') {
//             timeStart = new Date("2018-09-01");
//             timeEnd = new Date("2018-10-01");
//         }
//         if (!req.params.user) {
//             userEmail = req.user.email;
//         } else if (req.user.email == req.params.user) {
//             userEmail = req.params.user;
//         } else {
//             if (req.user.rank && req.user.rank == "Admin") {
//                 userEmail = req.params.user;
//             } else {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
//                 });
//                 return;
//             }
//         }
//         User.findOne({
//             email: userEmail
//         }).exec(function (err, result) {
//             if (err || !result) {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Không tồn tại user cần tìm'
//                 });
//                 return;
//             } else {
//                 var userID = result._id.toString();
//                 DetailDailyCache.find({
//                     $and: [{
//                         day: {
//                             $gte: timeStart,
//                             $lt: timeEnd
//                         }
//                     }, {
//                         userID: userID
//                     }]
//                 }).sort({
//                     day: 1
//                 }).exec((e, r) => {
//                     if (e || !r) {
//                         res.render('error', {
//                             title: 'Lỗi',
//                             message: 'Không tìm được lịch sử chi tiết'
//                         });
//                         return;
//                     } else {
//                         var totalValidTime = 0;
//                         r.forEach((day) => {
//                             if (day.validDuration && day.validDuration > 3600) {
//                                 totalValidTime += 3600;
//                             } else
//                                 if (day.validDuration) {
//                                     totalValidTime += day.validDuration;
//                                 }
//                         })
//                         res.render('detail', {
//                             title: 'Thống kê chi tiết',
//                             total: totalValidTime,
//                             days: r,
//                             userEmail: userEmail
//                         });
//                         return;
//                     }
//                 })
//             }
//         });
//     }
// }
// exports.updateDetail = (req, res, next) => {
//     function extractSentenceTextsInformation(sentenceTexts) {
//         var map = {};
//         sentenceTexts.forEach((s) => {
//             var day = s.updatedAt;
//             day = new Date(day - day % 86400000)
//             if (!map[day]) {
//                 map[day] = {
//                     totalDuration: 0,
//                     clearedDuration: 0,
//                     trashedDuration: 0,
//                     validDuration: 0
//                 }
//             }
//             map[day].totalDuration += s.maxDuration;
//             if (s.status == "clear") {
//                 map[day].clearedDuration += s.maxDuration;
//             } else
//                 if (s.status == "trash") {
//                     map[day].trashedDuration += s.maxDuration;
//                 } else {
//                     map[day].validDuration += s.maxDuration;
//                 }
//         });
//         var result = [];
//         var data;
//         for (var key in map) {
//             if (key) {
//                 data = map[key];
//                 data.day = new Date(key);
//                 result.push(data);
//             }
//         }
//         return result;
//     };
//     if (!req.user) {
//         res.render('error', {
//             title: 'Lỗi',
//             message: 'Đăng nhập đã nào'
//         });
//     } else {
//         var userEmail;
//         var timeStart, timeEnd;
//         if (!req.params.time) {
//             timeStart = new Date("2018-09-01");
//             timeEnd = new Date("2018-10-01");
//         } else if (req.params.time == '08') {
//             timeStart = new Date("2018-08-01");
//             timeEnd = new Date("2018-09-01");
//         } else if (req.params.time == '09') {
//             timeStart = new Date("2018-09-01");
//             timeEnd = new Date("2018-10-01");
//         }
//         if (!req.params.user) {
//             userEmail = req.user.email;
//         } else if (req.user.email == req.params.user) {
//             userEmail = req.params.user;
//         } else {
//             if (req.user.rank && req.user.rank == "Admin") {
//                 userEmail = req.params.user;
//             } else {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
//                 });
//                 return;
//             }
//         }
//         User.findOne({
//             email: userEmail
//         }).exec(function (err, result) {
//             if (err || !result) {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Không tồn tại user cần tìm'
//                 });
//                 return;
//             } else {
//                 var userID = result._id.toString();
//                 SentenceText.find({
//                     $and: [{
//                         updatedAt: {
//                             $gte: timeStart,
//                             $lt: timeEnd
//                         }
//                     }, {
//                         userID: userID
//                     }]
//                 }).exec(function (e, sentenceTexts) {
//                     if (e) {
//                         res.render('error', {
//                             title: 'Lỗi',
//                             message: 'User này chẳng có câu nào trong khoảng thời gian cần xét cả'
//                         });
//                         return;
//                     } else {
//                         var sentenceTextsInformation = extractSentenceTextsInformation(sentenceTexts);
//                         sentenceTextsInformation.forEach((d) => {
//                             d.userID = userID;
//                             DetailDailyCache.findOneAndUpdate({
//                                 day: d.day,
//                                 userID: userID
//                             }, {
//                                     $set: d
//                                 }, {
//                                     upsert: true
//                                 }, (e, r) => {
//                                     if (e) {
//                                         res.render('error', {
//                                             title: 'Lỗi',
//                                             message: 'Lỗi không update đưọc cache'
//                                         });
//                                         return;
//                                     } else { }
//                                 })
//                         });
//                         res.redirect(req.get('referer'));
//                         return;
//                     }
//                 });
//             }
//         });
//     };
// }
// exports.checkresult = (req, res, next) => {
//     if (!req.user) {
//         res.render('error', {
//             title: 'Lỗi',
//             message: 'Đăng nhập đã nào'
//         });
//     } else {
//         var userEmail;
//         var timeStart, timeEnd;
//         if (!req.params.time) {
//             timeStart = new Date("2018-09-01");
//             timeEnd = new Date("2018-10-01");
//         } else if (req.params.time == '08') {
//             timeStart = new Date("2018-08-01");
//             timeEnd = new Date("2018-09-01");
//         } else if (req.params.time == '09') {
//             timeStart = new Date("2018-09-01");
//             timeEnd = new Date("2018-10-01");
//         }
//         if (!req.params.user) {
//             userEmail = req.user.email;
//         } else {
//             if (req.user.rank && req.user.rank == "Admin") {
//                 userEmail = req.params.user;
//             } else if (req.user.email == req.params.user) {
//                 userEmail = req.params.user;
//             } else {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Bạn phải là Thu Hạnh hay Quang Khánh thì mới dùng được chức năng này :))'
//                 });
//                 return;
//             }
//         }
//         User.findOne({
//             email: userEmail
//         }).exec(function (err, result) {
//             if (err || !result) {
//                 res.render('error', {
//                     title: 'Lỗi',
//                     message: 'Không tồn tại user cần tìm'
//                 });
//                 return;
//             } else {
//                 var userID = result._id.toString();
//                 SentenceText.aggregate().match({
//                     $and: [{
//                         userID: userID
//                     }, {
//                         updatedAt: {
//                             $gte: timeStart,
//                             $lt: timeEnd,
//                         }
//                     }, {
//                         $or: [{
//                             status: "ban"
//                         }, {
//                             status: "approve"
//                         }]
//                     }]
//                 }).sort({
//                     updatedAt: -1
//                 }).exec(function (err, result) {
//                     if (err) {
//                         res.render('error', {
//                             title: 'Lỗi',
//                             message: 'Có gì đó không đúng, thử lại sau xem sao'
//                         });
//                         return;
//                     } else {
//                         var count = {
//                             ban: 0,
//                             approve: 0
//                         };
//                         for (var i = 0; i < result.length; ++i) {
//                             count[result[i].status]++;
//                         }
//                         res.render('checkresult', {
//                             title: 'Tổng kết',
//                             sentenceTexts: result,
//                             total: result.length,
//                             userEmail: userEmail,
//                             number_of_bans: count.ban,
//                             number_of_approves: count.approve
//                         });
//                         return;
//                     }
//                 })
//             };
//         });
//     }
// }