const mongoose = require('mongoose');
var detailDailyCacheSchema = new mongoose.Schema({
  day: Date,
  userID: String,
  totalDuration: Number,
  clearedDuration: Number,
  trashedDuration: Number,
  validDuration: Number
});
detailDailyCacheSchema.index({
  day: 1,
  userID: 1
}, {
  unique: true
});
const DetailDailyCache = mongoose.model('DetailDailyCache', detailDailyCacheSchema);
module.exports = DetailDailyCache;