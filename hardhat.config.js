require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.21",
      },
      {
        version: "0.8.18",
      },
    ],
  },
  networks: {
    goerli: {
      url: "https://rpc.ankr.com/eth_goerli",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        passphrase: "",
      },
    },
    mumbai: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      accounts: [],
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com	",
      accounts: [],
    },
    zetachain: {
      url: "https://zetachain-mainnet-archive.allthatnode.com:8545",
      accounts: [],
    },
  },
  etherscan: {
    apiKey: {
      goerli: "",
    },
    apiKey: {
      polygonMumbai: "",
    },
    apiKey: { sepolia: "API_KEY" },
    apiKey: { zetachain: "ZETA DOESNT SUPPORT VERIFYING FROM HARDHAT" },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
