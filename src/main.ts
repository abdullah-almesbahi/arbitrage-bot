import config, { provider } from "./config";
import { calculatePrice, getPairContract, getTokenAndContract } from "./helpers/blockchain";
import { onReceiveSwapEvent } from "./helpers/bot";
import { Contract } from "@ethersproject/contracts";
import { getPairs } from "./helpers/network";
import { ethers } from "hardhat";
import { PairsType } from "./types";
const fs = require("fs");

async function loadPairs(pairs: PairsType, account: string) {
  const { token0Contract, token1Contract, token0, token1 } = await getTokenAndContract(pairs.for, pairs.against);
  let uPair = await getPairContract(config.EXCHANGES_CONTRACT.UNISWAP.FACTORY, token0.address, token1.address);
  let sPair = await getPairContract(config.EXCHANGES_CONTRACT.SUSHISWAP.FACTORY, token0.address, token1.address);
  console.table([
    { name: "Uniswap pair address", value: uPair.address },
    { name: "Pair", value: `${token0.symbol}/${token1.symbol}` },
    { name: "Price", value: `1 ${token0.symbol} = ${(await calculatePrice(uPair)).toNumber().toFixed(0)} ${token1.symbol}` },
  ]);
  uPair.on("Swap", async () => {
    onReceiveSwapEvent({
      exchangeName: "Uniswap",
      token0Contract,
      token1Contract,
      token0,
      token1,
      uPair,
      sPair,
      account,
    });
  });

  console.table([
    { name: "Sushiswap pair address", value: sPair.address },
    { name: "Pair", value: `${token0.symbol}/${token1.symbol}` },
    { name: "Price", value: `1 ${token0.symbol} = ${(await calculatePrice(sPair)).toNumber().toFixed(0)} ${token1.symbol}` },
  ]);
  sPair.on("Swap", async () => {
    onReceiveSwapEvent({
      exchangeName: "Sushiswap",
      token0Contract,
      token1Contract,
      token0,
      token1,
      uPair,
      sPair,
      account,
    });
  });
  console.log("Waiting for swap event...");
}

async function main() {
  // Fetch account
  const [account] = await provider.listAccounts();
  const arbitragePairs = getPairs();
  for (let i = 0; i < arbitragePairs.length; i++) {
    await loadPairs(arbitragePairs[i], account);
  }
}

// run the bot
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
