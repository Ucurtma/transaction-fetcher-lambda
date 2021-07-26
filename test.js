require('dotenv').config();
const { fetchCampaigns } = require('./lib/data/campaigns');
const { getHowMuchLeftFromEthereum } = require('./lib/ethereum-clients');


const main = async () => {
    const campaigns = await fetchCampaigns();
    let count = 0;
    const totalCount = campaigns.length;
    console.log(`Total number of campaigns to fill: ${totalCount}`);
    const errorList = [];
    for (campaign of campaigns) {

        const address = campaign.ethereumAddress;
        if (address) {
            try {
                const fund = await getHowMuchLeftFromEthereum(address);
                console.log(`${++count} -)The '${campaign.campaignId}' '${address}' has '${fund}`);
            } catch (e) {
                errorList.push({ campaignId: campaign.campaignId, error: e, address });
            }
        } else {
            console.log(`${++count} -) Skipping ${campaign.campaignId}`);
        }
    }
    console.log(`Done. Failed records:`);
    errorList.map(item => {
        console.log(`\t${item.campaignId} (${item.address})`);
    });
}
main();
