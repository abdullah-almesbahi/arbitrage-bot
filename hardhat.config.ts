import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import { accounts, node_url } from "./src/helpers/network";
dotenv.config();

// const gas = Number(process.env.GAS_LIMIT || 600000);
// const gas = 6000000;
// const gasPrice = 80000000000;
// const gasPrice = Number(process.env.GAS_PRICE || 0.0093);

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    hardhat: {
      forking: {
        url: node_url("mainnet"),
      },
      accounts: accounts(),
      // gas,
      // gasPrice,
    },
    localhost: {
      url: node_url("localhost"),
      // gas,
      // gasPrice,
    },
    staging: {
      url: node_url("rinkeby"),
      accounts: accounts("rinkeby"),
    },
    production: {
      url: node_url("mainnet"),
      accounts: accounts("mainnet"),
    },
    mainnet: {
      url: node_url("mainnet"),
      accounts: accounts("mainnet"),
      chainId: 1,
    },
    rinkeby: {
      url: node_url("rinkeby"),
      accounts: accounts("rinkeby"),
    },
    kovan: {
      url: node_url("kovan"),
      accounts: accounts("kovan"),
    },
    goerli: {
      url: node_url("goerli"),
      accounts: accounts("goerli"),
      chainId: 5,
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    maxMethodDiff: 10,
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "A3XURWC28R7M95WE6TJP8IE5673ADTH8BM",
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    let wei = await (await account.getBalance()).toString();
    console.log(account.address, `${hre.ethers.utils.formatEther(wei)} ETH`);
  }
});

task("swap", "Manipulate the price with specific pairs")
  .addOptionalPositionalParam("pair")
  .setAction(async ({ pair }, hre) => {
    if (!pair) {
      pair = 0;
    }
    const manipulatePrice = require("./src/swap.test").default;
    // console.log("manipulatePrice", manipulatePrice);
    // import manipulatePrice from "./src/swap.test";
    await manipulatePrice(pair).catch((error: Error) => {
      console.error(error);
      process.exitCode = 1;
    });
  });

export default config;
