import { ethers } from "hardhat";
import config from "../src/config";

async function main() {
  const Arbitrage = await ethers.getContractFactory("Arbitrage");
  const arbitrage = await Arbitrage.deploy(config.EXCHANGES_ADDRESS.SUSHISWAP.V2_ROUTER_02_ADDRESS, config.EXCHANGES_ADDRESS.UNISWAP.V2_ROUTER_02_ADDRESS);
  await arbitrage.deployed();

  console.log(`Arbitrage deployed to ${arbitrage.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
