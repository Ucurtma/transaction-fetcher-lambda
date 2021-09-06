const Web3 = require('web3');
const axios = require('axios').default;
const cheerio = require('cheerio');
const moment = require('moment');

const infuraUrl = `https://api.avax.network/ext/bc/C/rpc`;
const DeploymentManagerAddress =
    process.env.DEPLOYMENT_MANAGER_ADDRESS ||
    '0x955E5F56fae77Db5829FAE980ADeAc688fE80259';
const { ethers } = require("ethers");
const fundingSmartContractABI = require('./Erc20FundingContract-avax.json');

const getWeb3Provider = () => {
    const provider = process.env.PROVIDER_TYPE || 'infura';
    switch (provider) {
        case 'infura':
        default:
            return new Web3(infuraUrl);
    }
};
const web3 = getWeb3Provider();

module.exports.fetchAvalancheSupports = async (address) => {
    const parseTransactions = (response) => {
        return response.data.items.map(transactionHtml => {
            const $ = cheerio.load(transactionHtml);
            const tokenTransferSection = $('div[data-test="token_transfer"]');
            const from = tokenTransferSection.find('span[data-address-hash]')[0].attribs['data-address-hash'];
            const to = tokenTransferSection.find('span[data-address-hash]')[1].attribs['data-address-hash'];
            const token = $('a[data-test="token_link"]').text();
            const amount = $('a[data-test="token_link"]').parent().text().replace(token, '').replace(',', '').trim();
            const when = $('span[data-from-now]').data('from-now');

            return {
                from,
                amount,
                tokenName: token,
                type: to == address ? 'IN' : 'OUT',
                when: moment(when).valueOf(),
                source: 'Avalanche'
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

module.exports.getTotalFundsFromAvalanche = async (address) => {
    const contract = new web3.eth.Contract(fundingSmartContractABI, address);
    const totalBalanceInDecimals = await contract.methods
        .totalBalance(address)
        .call();
    return parseInt(totalBalanceInDecimals) / Math.pow(10, 6);
};

module.exports.getCampaignEndDateFromAvalanche = async (publicAddress) => {
    const contract = new web3.eth.Contract(
        fundingSmartContractABI,
        publicAddress
    );
    const campaignEndDate = await contract.methods.lastWithdraw().call();
    return parseInt(campaignEndDate);
};

module.exports.getCampaignWithdrawPeriodFromAvalanche = async (address) => {
    const contract = new web3.eth.Contract(fundingSmartContractABI, address);
    const withdrawPeriod = await contract.methods.withdrawPeriod().call();
    return parseInt(withdrawPeriod);
};