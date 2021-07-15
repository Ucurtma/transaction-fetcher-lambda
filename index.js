require('dotenv').config();
const axios = require('axios').default;
const cheerio = require('cheerio');
const { ethers } = require("ethers");
const moment = require('moment');
const { fetchCampaigns, updateCampaign } = require('./lib/data/campaigns');
const fetchEthereumSupports = async (address) => {
    const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${campaign.ethereumAddress}&startblock=0&endblock=999999999&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`);

    return response.data.result.map(transaction => {
        return {
            from: transaction.from,
            amount: ethers.utils.formatUnits(transaction.value, transaction.tokenDecimal),
            tokenName: transaction.tokenName,
            type: transaction.to == address ? 'IN' : 'OUT',
            when: (transaction.timeStamp * 1000), // convert to ms
        };
    });
};

const fetchAvalancheSupports = async (address) => {
    const parseTransactions = (response) => {
        return response.data.items.map(transactionHtml => {
            const $ = cheerio.load(transactionHtml);
            const tokenTransferSection = $('div[data-test="token_transfer"]');
            const from = tokenTransferSection.find('span[data-address-hash]')[0].attribs['data-address-hash'];
            const to = tokenTransferSection.find('span[data-address-hash]')[1].attribs['data-address-hash'];
            const token = $('a[data-test="token_link"]').text();
            const amount = $('a[data-test="token_link"]').parent().text().replace(token, '').trim();
            const when = $('span[data-from-now]').data('from-now');

            return {
                from,
                amount,
                tokenName: token,
                type: to == address ? 'IN' : 'OUT',
                when: moment(when).valueOf(),
            }
        });
    };

    const transactions = [];
    let requestUrl = `https://cchain.explorer.avax.network/address/${address}/token-transfers?type=JSON`;

    while (true) {
        const response = await axios.get(requestUrl);
        transactions.push(...parseTransactions(response));

        if (!response.data.next_page_path) {
            break;
        }

        requestUrl = `https://cchain.explorer.avax.network${response.data.next_page_path}`;
    }

    return transactions;
};

const main = async () => {
    const campaigns = await fetchCampaigns();

    for (campaign of campaigns.filter(c => c.isActive)) {
        campaign.transactions = [];

        if (campaign.ethereumAddress) {
            const ethSupports = await fetchEthereumSupports(campaign.ethereumAddress);
            campaign.transactions.push(...ethSupports);
        }
        debugger;

        if (campaign.avalancheAddress) {
            // const avalancheSupports = await fetchAvalancheSupports(campaign.avalancheAddress);
            const avalancheSupports = await fetchAvalancheSupports('0x2E36833DE3C60FA50A40dE6FAa1d97Be299baf2A');
            campaign.transactions.push(...avalancheSupports);

            campaign.transactions = campaign.transactions.sort((s1, s2) => s2.when - s1.when);
        }
        await updateCampaign(campaign);
    }
}
main();
