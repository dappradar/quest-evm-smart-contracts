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
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [],
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [],
    },
    kroma: {
      url: "https://1rpc.io/kroma",
      accounts: [],
    },
    zetachain: {
      url: "https://zetachain-mainnet-archive.allthatnode.com:8545",
      accounts: [],
    },
    base: {
      url: "https://base.llamarpc.com",
      accounts: [],
    },
    telosEVM: {
      url: "https://rpc.telos.net",
      accounts: [],
    },
  },
  etherscan: {
    apiKey: { sepolia: "" },
    apiKey: { zetachain: "ZETA DOESNT SUPPORT VERIFYING FROM HARDHAT" },
    apiKey: { base: "" },
    apiKey: { kroma: "" },
    apiKey: { amoy: "" },
    customChains: [
      {
        network: "kroma",
        chainId: 255,
        urls: {
          apiURL: "https://api.kromascan.com/api",
          browserURL: "https://kromascan.com/",
        },
      },
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io/",
        },
      },
    ],
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
