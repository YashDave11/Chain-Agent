require("@nomicfoundation/hardhat-ethers");

// Hardcoded for deployment
const SEPOLIA_RPC = "https://eth-sepolia.g.alchemy.com/v2/xt-CJPLqZw7KmoE_rsyZQ";
const PRIVATE_KEY = "8aee578e272bf2d35023c1ada027c228f3353e244b6f966b6951802bfcd7d776";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
