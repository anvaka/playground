var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var multipart = require('aws-lambda-multipart-parser');
var crypto = require('crypto');
var bucket = 'osm-play-v1'
// var fileType = require('file-type');

function putObjectToS3(key, data){
  return new Promise((resolve, reject) => {
    var params = {
        Bucket: bucket,
        Key: key,
        Body: data
    }

    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        reject(err);
      }
      else {
        console.log(data);           // successful response
        resolve(data);
      }
    });
  }).then(res => {
      const signedUrlExpireSeconds = 60 * 5;
      return s3.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: key,
        Expires: signedUrlExpireSeconds
      });
  })
}

exports.handler = (event, context, callback) => {
  console.log(event);
  let parsed = multipart.parse(event);
  console.log(parsed);
  let buffer = new Buffer(parsed.image, 'base64');
  const fileName = 'img0-' + crypto.randomBytes(16).toString("hex") + '.png';

  putObjectToS3(fileName, buffer).then(data => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        file: fileName,
        data
      }),
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  })
};
