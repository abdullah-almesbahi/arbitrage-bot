import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import { accounts, node_url } from "./src/helpers/network";
dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    hardhat: {
      forking: {
        url: node_url("mainnet"),
      },
      accounts: accounts(),
      // gas:
      // gasPrice
    },
    localhost: {
      url: node_url("localhost"),
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
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    maxMethodDiff: 10,
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
