#!/bin/zsh

GOOGLE_APPLICATION_CREDENTIALS=~/streak-service-account.json
GRPC_NATIVE_FILE=./handler/node_modules/grpc/src/node/extension_binary/grpc_node.node
GRPC_TEMPORARY_FILE=./grpc_node.current_os.node

if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]
then
  echo "Make sure to set \$GOOGLE_APPLICATION_CREDENTIALS variable before running this script"
  echo "Read more here: https://cloud.google.com/docs/authentication"
  exit 1
fi

echo "Copying key file $GOOGLE_APPLICATION_CREDENTIALS to ./handler folder"
echo "If this script fails, make sure to remove the file afterwards. Never ever commit it to the upstream repository"

cp $GOOGLE_APPLICATION_CREDENTIALS ./handler/streak-service-account.json

echo "Done.\n"
echo "Backing up grpc precompiled binary for the current OS"

if [ ! -f "$GRPC_NATIVE_FILE" ]
then
  echo "Cannot find grpc native file. Make sure to run npm install inside ./handler folder"
  exit 1
fi

cp $GRPC_NATIVE_FILE $GRPC_TEMPORARY_FILE

echo "Done. Replacing grpc file with AWS Lambda precompiled version"
cp ./precompiled/grpc_node.node $GRPC_NATIVE_FILE

echo "Done. Performing deployment"

aws cloudformation package --template-file ./setup-aws-backend.yaml --s3-bucket dyno-test-lam-sam --output-template-file build/packaged-template.yaml &&
aws cloudformation deploy --template-file ./build/packaged-template.yaml --capabilities CAPABILITY_IAM --stack-name lambda-datastore-test &&
aws cloudformation describe-stacks --stack-name lambda-datastore-test

echo "Removing key file"
rm ./handler/streak-service-account.json

echo "Restoring GRPC file"
cp $GRPC_TEMPORARY_FILE $GRPC_NATIVE_FILE
echo "Done."
