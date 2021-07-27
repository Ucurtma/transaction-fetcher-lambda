require('dotenv').config();
const { fetchCampaigns, updateCampaign } = require('./lib/data/campaigns');
const { fetchEthereumSupports, getTotalFundsFromEthereum, getCampaignEndDate, getCampaignWithdrawPeriod } = require('./lib/ethereum-clients');
const { fetchAvalancheSupports, getTotalFundsFromAvalanche, getCampaignEndDateFromAvalanche, getCampaignWithdrawPeriodFromAvalanche } = require('./lib/avalanche-clients');

const getCampaignEthereumAttributes = async (campaign) => {
    if (campaign.ethereumAddress) {
        const ethSupports = await fetchEthereumSupports(campaign.ethereumAddress);
        campaign.transactions.push(...ethSupports);
    }
    if (campaign.fundingType === 'long-term') {
        campaign.totalFunds = await getTotalFundsFromEthereum(
            campaign.ethereumAddress
        );
    }
    campaign.endDate = await getCampaignEndDate(campaign.ethereumAddress);

    if (campaign.campaignType === 'LongTerm') {
        campaign.endDate += await getCampaignWithdrawPeriod(
            campaign.ethereumAddress
        );
    }
    return campaign;
};

const getCampaignAvalancheAttributes = async (campaign) => {
    const avalancheSupports = await fetchAvalancheSupports(campaign.avalancheAddress);
    campaign.transactions.push(...avalancheSupports);

    if (campaign.fundingType === 'long-term') {
        campaign.totalFunds = await getTotalFundsFromAvalanche(
            campaign.avalancheAddress
        );
    }
    campaign.endDate = await getCampaignEndDateFromAvalanche(campaign.avalancheAddress);
    campaign.endDate += await getCampaignWithdrawPeriodFromAvalanche(
        campaign.avalancheAddress
    );
    return campaign;
};

module.exports.index = async () => {
    const campaigns = await fetchCampaigns();
    let count = 0;
    const totalCount = campaigns.length;
    console.log(`Total number of campaigns to fill: ${totalCount}`);
    const errorList = [];
    for (campaign of campaigns) {
        console.log(`Filling for ${campaign.campaignId} (${++count}/${totalCount})`);
        campaign.transactions = [];
        if (campaign.ethereumAddress) {
            try {
                console.log(`\tFetching for Ethereum details`);
                campaign = await getCampaignEthereumAttributes(campaign);
            }
            catch (e) {
                console.log(`Error occcured on ${campaign.campaignId}. Skipping...`);
                errorList.push({
                    campaignId: campaign.campaignId,
                    source: 'ethereum',
                    error: e
                });
            }
        }
        if (campaign.avalancheAddress) {
            try {
                console.log(`\tFetching for Avalanche details`);
                campaign = await getCampaignAvalancheAttributes(campaign);
            }
            catch (e) {
                console.log(`Error occcured on ${campaign.campaignId}. Skipping... \nError: \n\t${e}`);
                errorList.push({
                    campaignId: campaign.campaignId,
                    source: 'avalanche',
                    error: e
                });
            }
        }
        campaign.transactions = campaign.transactions.sort((s1, s2) => s2.when - s1.when);
        await updateCampaign(campaign);
    }
    console.log(`Done. Failed records:`);
    errorList.map(item => {
        console.log(`\t${item.campaignId} (${item.source})`);
    });
}
