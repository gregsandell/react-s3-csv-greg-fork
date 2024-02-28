const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
const app = express();
const port = process.env.SERVER_PORT || 5001;
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Test access key and secrete key
AWS.config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});
app.use(cors());

app.post("/begin-upload", (req, res) => {
  //get name of the file we're trying to upload
  const fileType = req.body.fileType; // GJS possibly add as metadata?
  const s3FilenamePath = req.body.s3FilenamePath

  //Create new "Upload" record in DB, which will have status.
  const uploadID = 70;

  //Generate presigned URL
  const s3 = new AWS.S3();
  const myBucket = process.env.BUCKET_NAME;
  const signedUrlExpireSeconds = 60 * 5;

  const url = s3.getSignedUrl("putObject", {
    Bucket: myBucket,
    Key: s3FilenamePath, // GJS Is this what gets the file data/blob uploaded?
    ContentType: "multipart/form-data",
    Expires: signedUrlExpireSeconds,
  });

  res.send({
    fileLocation: url,
    uploadID: uploadID, // GJS metadata-relevant (perhaps) but unused
  });
});

app.post("/process-upload", (req, res) => {
  //The request body will have the ID of the upload
  let uploadID = req.body.uploadID; // GJS metadata-relevant (perhaps) but unused
  const s3FilenamePath = req.body.s3FilenamePath

  //In practice we would get the upload information and retireve file location
  //For testing we know
  const s3 = new AWS.S3();
  const myBucket = process.env.BUCKET_NAME;
  const file = s3 // GJS Grab the file data we sent by the "putObject" fetch call (not sure about this)
    .getObject({
      Bucket: myBucket,
      Key: s3FilenamePath,
    })
    .createReadStream();
  let results = [];
  file
    .pipe(csv())
    .on("data", function (data) {
      results.push(data);
    })
    .on("end", () => {
      res.send({ results: results });
      console.log("done");
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
