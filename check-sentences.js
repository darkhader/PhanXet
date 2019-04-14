var mongo = require('mongodb').MongoClient;
var fs = require('fs');
var url = "mongodb://172.18.0.2:27017/";
mongo.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("asr");
  var query = {
    $and: [{
      "userID": {
        $ne: null
      }
    }, {
      "updatedAt": {
        $lt: new Date("2018-09-25")
      }
    }]
  }
  var limit = 5000;
  var start = 0;
  var search = () => {
    var found = false;
    dbo.collection("sentences").find(query).limit(limit).skip(start).toArray(function(err, result) {
      result.forEach((r) => {
        if (!fs.existsSync(r.path)) {
          found = true;
          dbo.collection("sentences").updateOne({
            _id: r._id
          }, {
            $unset: {
              userID: "",
              status: ""
            }
          }, (error, response) => {
            if (error) {
              console.log(error);
            } else {
              console.log("Duoc roi " + r.path);
            }
          });
        }
      });
      if (found) {
        search();
      } else {
        start += limit;
        console.log(start);
        search();
      }
    });
  }
  search();
})
