const mongoose = require('mongoose');
const sentenceTextSchema = new mongoose.Schema({
  text: String,
  userID: {type:String, default:null},
  userChoose: {type:String, default:null},
  userReport: [{type:String, default:null}],
  yes:{type:Number, default:0},
  no:{type:Number, default:0},
  status: String,
  createdAt: Date,
  updatedAt: Date
});
const SentenceText = mongoose.model('SentenceText', sentenceTextSchema);
module.exports = SentenceText;