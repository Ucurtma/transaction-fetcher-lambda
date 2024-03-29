const AWS = require('aws-sdk');
module.exports.AWS = AWS;

const SERVICE_NAME = 'dynamodb';
const REGION = 'eu-west-2';

module.exports.configuration = {
    region: REGION,
    endpoint:
        process.env.DYNAMO_HOST ||
        `https://${SERVICE_NAME}.${REGION}.amazonaws.com`,
    accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID,
    secretAccessKey: process.env.DYNAMO_SECRET_ACCESS_KEY,
};
