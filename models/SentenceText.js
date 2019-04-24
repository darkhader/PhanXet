const mongoose = require('mongoose');
const sentenceTextSchema = new mongoose.Schema({
  text: String,
  userID: {type:String, default:null},
  userChoose: {type:String, default:null},
  userReport: [{type:String, default:null}],
  answer:{type:String, default:null},
  status: {type:String, default:null},
  createdAt: Date,
  updatedAt: Date
});
const SentenceText = mongoose.model('SentenceText', sentenceTextSchema);
module.exports = SentenceText;