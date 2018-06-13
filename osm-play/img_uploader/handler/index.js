var AWS = require('aws-sdk');
var fileType = require('file-type');

function putObjectToS3(bucket, key, data){
    var s3 = new AWS.S3();
    var params = {
        Bucket : bucket,
        Key : key,
        Body : data
    }

  return new Promise((resolve, reject) => {
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
  });
}

exports.handler = (event, context, callback) => {
  let request = event.body;
  let {base64String} = request;
  let buffer = new buffer(base64String, 'base64');
    // Get the object from the event and show its content type
  let fileMime = fileType(buffer);
  console.log('file type is ', fileMime);
  callback(null, JSON.stringify({
    statusCode: 200,
    body: fileMime,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }));
};
