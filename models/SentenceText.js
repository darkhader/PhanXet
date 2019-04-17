const mongoose = require('mongoose');
const sentenceTextSchema = new mongoose.Schema({
  text: String,
  // detected_text: String,
  // detected_point: Number,
  // pathText: String,
  userID: {type:String, default:null},
  yes:{type:Number, default:0},
  no:{type:Number, default:0},
  picks: {
    type: Number,
    default: 0
  },
  processed: {
    type: Boolean,
    default: false
  },
  owner_info: {
    name:String,
 
  },
  status: String,
  createdAt: Date,
  updatedAt: Date
});
const SentenceText = mongoose.model('SentenceText', sentenceTextSchema);
module.exports = SentenceText;