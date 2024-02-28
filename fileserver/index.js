const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
const app = express();
const port = process.env.SERVER_PORT || 5001;

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
  let fileName = req.body.fileName;
  let fileType = req.body.fileType;

  //Fake user ID, get from logged in user
  let userID = "12345";

  //Create new "Upload" record in DB, which will have status.
  let uploadID = 70;

  //Generate presigned URL
  const s3 = new AWS.S3();
  const myBucket = process.env.BUCKET_NAME;
  const myKey = userID + "/" + fileName;
  const signedUrlExpireSeconds = 60 * 5;

  const url = s3.getSignedUrl("putObject", {
    Bucket: myBucket,
    Key: myKey,
    ContentType: "multipart/form-data",
    Expires: signedUrlExpireSeconds,
  });

  res.send({
    fileLocation: url,
    uploadID: 70,
  });
});

app.post("/process-upload", (req, res) => {
  //The request body will have the ID of the upload
  let uploadID = req.body.uploadID;

  //In practice we would get the upload information and retireve file location
  //For testing we know
  const s3 = new AWS.S3();
  const myBucket = "MY BUCKET";
  const myKey = 12345 + "/" + "FILE NAME";
  const file = s3
    .getObject({
      Bucket: myBucket,
      Key: myKey,
    })
    .createReadStream();
  let results = [];
  file
    .pipe(csv())
    .on("data", function (data) {
      results.push(data); // --> here
    })
    .on("end", () => {
      res.send({ results: results });
      console.log("done");
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
