"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var config = require("config");
var cors = require("cors");
var dns = require("dns");

var app = express();

// Basic Configuration
var port = 3000;

/** connection of my app to my db using the config style not .env **/

const db = config.get("MONGO_URI");
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log("Connected to database!!"))
  .catch(err => console.log("There was an error " + err));

//defining my schema
let Schema = mongoose.Schema;

let docSchema = new Schema({
  original_url: mongoose.Mixed,
  short_url: mongoose.Mixed
});

let docModel = mongoose.model("docModel", docSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your API endpoint...
app.post("/api/shorturl/new", function(req, res) {
  //path to user's inputed url in the text input field
  let path = req.body.url;
  //user's inputed url
  let originalUrl = path;

  //generating the random numbers to be used for the short url
  let basicNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let urlValues = [];
  while (urlValues.length < 3) {
    let random = basicNumbers[Math.floor(Math.random() * basicNumbers.length)];
    urlValues.push(random);
  }
  //generated short url
  let shortUrl = urlValues.join("");
  //if the user's inputed url is not a number, check if the url is valid
  if (!Number(originalUrl)) {
    dns.lookup(originalUrl, function(err, addresses, family) {
      if (addresses) {
        docModel.findOne({ original_url: originalUrl }, function(err, data) {
          if (data) {
            res.json({
              original_url: data.original_url,
              short_url: data.short_url
            });
          } else {
            let newAddress = { original_url: originalUrl, short_url: shortUrl };
            let dbAddress = new docModel(newAddress);
            console.log("New url and short url created!!");
            dbAddress.save().then(console.log("Saved to database!!"));
            res.json(newAddress);
          }
        });
      } else {
        res.json({ error: "Invalid Hostname" });
      }
    });
  } else {
    res.json({ error: "Wrong Format" });
  }
});

app.get("/api/shorturl/:new_url", function(req, res) {
  let path = req.path;
  let splitting = path.split("/");
  let shortUrl = splitting[3];

  if (Number(shortUrl)) {
    docModel.findOne({ short_url: shortUrl }, function(err, data) {
      if (data) {
        let url = "https://";
        res.redirect(url + data.original_url);
      } else {
        res.send({ error: "No short url found for the given input" });
      }
    });
  } else {
    res.send({ error: "Wrong Format" });
  }
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
