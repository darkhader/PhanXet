const mongoose = require('mongoose');
const sentenceSchema = new mongoose.Schema({
  text: String,
  detected_text: String,
  detected_point: Number,
  path: String,
  userID: String,
  maxDuration: Number,
  duration: {
    type: Number,
    default: 0
  },
  picks: {
    type: Number,
    default: 0
  },
  processed: {
    type: Boolean,
    default: false
  },
  owner_info: {
    accent: String,
    gender: String,
    year_of_birth: Number
  },
  status: String,
  createdAt: Date,
  updatedAt: Date
});
const Sentence = mongoose.model('Sentence', sentenceSchema);
module.exports = Sentence;