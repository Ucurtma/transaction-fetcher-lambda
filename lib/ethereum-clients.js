const Web3 = require('web3');
const axios = require('axios').default;

const infuraUrl = `https://${process.env.ETH_NETWORK || 'rinkeby'
    }.infura.io/v3/${process.env.INFURA_PROJECT_KEY}`;
const DeploymentManagerAddress =
    process.env.DEPLOYMENT_MANAGER_ADDRESS ||
    '0x9CbBcE049B452b9481Db84280e2c1F190DeCbade';
const { ethers } = require("ethers");
const fundingSmartContractABI = require('./Erc20FundingContract-eth.json');
const ERC20 = require('./ERC20.json');

const getWeb3Provider = () => {
    const provider = process.env.PROVIDER_TYPE || 'infura';
    switch (provider) {
        case 'infura':
        default:
            return new Web3(infuraUrl);
    }
};
const web3 = getWeb3Provider();

module.exports.fetchEthereumSupports = async (address) => {
    const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${campaign.ethereumAddress}&startblock=0&endblock=999999999&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`);

    return response.data.result.map(transaction => {
        return {
            from: transaction.from,
            amount: ethers.utils.formatUnits(transaction.value, transaction.tokenDecimal),
            tokenName: transaction.tokenName,
            type: transaction.to == address ? 'IN' : 'OUT',
            when: (transaction.timeStamp * 1000), // convert to ms
            source: 'Ethereum'
        };
    });
};

module.exports.getHowMuchLeftFromEthereum = async (address) => {
    const contract = new web3.eth.Contract(ERC20, '0x2c537e5624e4af88a7ae4060c022609376c8d0eb');
    const tokenBalance = await contract.methods.balanceOf(address).call();
    return tokenBalance / Math.pow(10, 6);
}

module.exports.getTotalFundsFromEthereum = async (address) => {
    const contract = new web3.eth.Contract(fundingSmartContractABI, address);
    const totalBalanceInDecimals = await contract.methods
        .totalBalance(address)
        .call();
    return parseInt(totalBalanceInDecimals) / Math.pow(10, 6);
};

module.exports.getCampaignEndDate = async (publicAddress) => {
    const contract = new web3.eth.Contract(
        fundingSmartContractABI,
        publicAddress
    );
    const campaignEndDate = await contract.methods.lastWithdraw().call();
    return parseInt(campaignEndDate);
};

module.exports.getCampaignWithdrawPeriod = async (address) => {
    const contract = new web3.eth.Contract(fundingSmartContractABI, address);
    const withdrawPeriod = await contract.methods.withdrawPeriod().call();
    return parseInt(withdrawPeriod);
};
