const mongoose = require('mongoose');
const sentenceTextSchema = new mongoose.Schema({
  text: String,
  userEmail: {type:String, default:null},
  userChoose: {type:String, default:null},
  userReport: [{type:String, default:null}],
  userReportCheckResult:{type:Boolean, default:false},
  answer:{type:String, default:null},
  status: {type:String, default:null},
  createdAt: Date,
  updatedAt: Date
});
const SentenceText = mongoose.model('SentenceText', sentenceTextSchema);
module.exports = SentenceText;