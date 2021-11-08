const { dynamoClient } = require('../aws-client');
const CAMPAIGNS_TABLE_NAME = process.env.DEBUG ? 'uc-non-prod-ucurtma-campaigns-non-prod' : 'uc-prod-ucurtma-campaigns-prod';

module.exports.fetchCampaigns = async () => {
    const key = 'isActive';
    const value = true;
    const param = {
        TableName: CAMPAIGNS_TABLE_NAME,
        FilterExpression: `#${key}=:${key}`,
        ExpressionAttributeNames: {},
        ExpressionAttributeValues: {},
    };

    param.ExpressionAttributeNames[`#${key}`] = `${key}`;
    param.ExpressionAttributeValues[`:${key}`] = value;
    const { Items } = await dynamoClient.scan(param).promise();
    return Items;
};

module.exports.updateCampaign = async (campaign) => {
    return await dynamoClient.put({
        TableName: CAMPAIGNS_TABLE_NAME,
        Item: campaign
    }).promise();
};