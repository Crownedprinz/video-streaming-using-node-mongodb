const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const fs = require("fs");
const url = "mongodb://localhost:27017";
let db;

mongodb.MongoClient.connect(url, function (error, client) {
  if (error) {
    res.status(500).json(error);
    return;
  }
  // connect to the videos database
  db = client.db("videos");
});

router.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

router.get("/init-video", (req, res, nex) => {
  // Create GridFS bucket to upload a large file
  const bucket = new mongodb.GridFSBucket(db);

  // create upload stream using GridFS bucket
  const videoUploadStream = bucket.openUploadStream("bigbuck");

  // You can put your file instead of bigbuck.mp4
  const videoReadStream = fs.createReadStream("./bigbuck.mp4");

  // Finally Upload!
  videoReadStream.pipe(videoUploadStream);

  // All done!
  res.status(200).send("Done...");
});

router.get("/load", (req, res, next) => {
  // GridFS Collection
  db.collection("fs.files").findOne({}, (err, video) => {
    if (!video) {
      res.status(404).send("No video uploaded!");
      return;
    }

    // Check for range headers to find our start time
    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }

    // Create response headers
    const videoSize = video.length;
    const start = Number(range.replace(/\D/g, ""));
    const end = videoSize - 1;

    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // Get the bucket and download stream from GridFS
    const bucket = new mongodb.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStreamByName("bigbuck", {
      start,
    });

    // Finally pipe video to response
    downloadStream.pipe(res);
  });
});

module.exports = router;
