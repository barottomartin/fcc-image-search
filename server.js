var express = require('express');
var app = express();
var mongodb = require('mongodb');
var dbUrl = process.env.MONGOLAB_URI;
var dbClient = mongodb.MongoClient;
var search = require('google-images');
var searchClient = new search(process.env.ENGINE_ID, process.env.GOOGLE_API_KEY);

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/api/latest/imagesearch", function(req, res){
  dbClient.connect(dbUrl, function (err, db) {
    if (!err){
      db.collection('history').find({}, { _id: 0 }).sort({ when: -1 }).limit(10).toArray(function(err, data){
        if (!err){
          res.send(data.map(function(v){ return { term: v.term, when: new Date(v.when).toISOString() }; }));
        } else {
          res.sendStatus(500);
        }
        db.close();
      });
    } else {
      console.error(err);
    }      
  });
});

app.get("/api/imagesearch/:terms", function(req, res){
  dbClient.connect(dbUrl, function (err, db) {
    if (!err){
      db.collection('history').insert({ term: req.params.terms, when: new Date().getTime() }, function(err, data) {
        if (err) console.error(err);
        db.close();
      });      
    } else {
      console.error(err);
    }
  });
  
  var page = 1;
  if (!isNaN(req.query.offset)){
    page = parseInt(req.query.offset);
  }
  searchClient.search(req.params.terms, { page: page }).then(function(data){
    res.send(data.map(function(v){ return {
      url: v.url,
      snippet: v.description,
      thumbnail: v.thumbnail.url,
      context: v.parentPage
    };}));
  });
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
