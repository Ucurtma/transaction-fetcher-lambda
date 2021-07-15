const {
    AWS,
    configuration,
} = require('./aws-config');

module.exports = {
    dynamoClient: new AWS.DynamoDB.DocumentClient(configuration),
};
