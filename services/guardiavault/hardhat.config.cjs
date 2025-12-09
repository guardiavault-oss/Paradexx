require('dotenv/config');
require('@nomicfoundation/hardhat-toolbox');
// @typechain/hardhat is included in hardhat-toolbox

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based compilation to resolve "stack too deep" errors
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  sourcify: {
    enabled: false
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    require: ['ts-node/register/transpile-only'],
    extensions: ['ts'],
    timeout: 120000,
  },
};

module.exports = config;
