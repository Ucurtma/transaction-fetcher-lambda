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

module.exports.fetchAvalancheSupportsFromSnowTrace = async (address) => {
    const response = await axios.get(`https://api.snowtrace.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`);

    return response.data.result.map(transaction => {
        return {
            from: transaction.from,
            amount: ethers.utils.formatUnits(transaction.value, transaction.tokenDecimal),
            tokenName: transaction.tokenName,
            type: transaction.to.toLowerCase() === address.toLowerCase() ? 'IN' : 'OUT',
            when: (transaction.timeStamp * 1000), // convert to ms
            source: 'Avalanche'
        };
    });
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