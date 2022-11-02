import config, { provider } from "./config";
import { getPairContract, getTokenAndContract } from "./helpers/blockchain.js";
import { onReceiveSwapEvent } from "./helpers/bot.js";
const fs = require("fs");

let uPair, sPair;

async function main() {
  // check if smart contract is deployed
  if (config.PROJECT_SETTINGS.isDeployed) {
    if (!fs.existsSync(__dirname + "/../contracts/Arbitrage.json")) {
      console.log("********************************\n Error: You need to deploy contract with this command line: truffle migrate --reset \n********************************");
      return;
    }
  }

  // Fetch account
  provider.getAccount();
  const [account] = await web3.eth.getAccounts();

  for (let i = 0; i < config.ARBITRAGE_TOKENS.length; i++) {
    const { token0Contract, token1Contract, token0, token1 } = await getTokenAndContract(config.ARBITRAGE_TOKENS[i].for, config.ARBITRAGE_TOKENS[i].against);

    uPair = await getPairContract(config.EXCHANGES_CONTRACT.UNISWAP.FACTORY, token0.address, token1.address);
    sPair = await getPairContract(config.EXCHANGES_CONTRACT.SUSHISWAP.FACTORY, token0.address, token1.address);

    console.log(`uPair Address: ${uPair._address} , Pair: ${token0.symbol}/${token1.symbol}`);
    console.log(`sPair Address: ${sPair._address} , Pair: ${token0.symbol}/${token1.symbol}\n`);

    uPair.events.Swap({}, async () => {
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

    sPair.events.Swap({}, async () => {
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
}

// run the bot
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
