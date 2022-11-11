import { Token } from "@uniswap/sdk";
import { ethers } from "hardhat";
import config, { exchangesForkedUniswapV2 } from "./config";
import { BigNumber } from "@ethersproject/bignumber";
import { calculatePrice, getPairContract } from "./helpers/blockchain";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

// const IUniswapV2Router02 = require("@uniswap/v2-periphery/build/IUniswapV2Router02.json");
// const IUniswapV2Factory = require("@uniswap/v2-core/build/IUniswapV2Factory.json");
const IERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");

const chainId = 1;
// const provider = new ethers.providers.WebSocketProvider("ws://127.0.0.1:8545");
const provider = new ethers.providers.WebSocketProvider("ws://127.0.0.1:8545", { chainId: 31337, name: "unknown" });
const signer = provider.getSigner();

const V2_FACTORY_TO_USE = config.EXCHANGES_CONTRACT.UNISWAP.FACTORY;
const V2_ROUTER_TO_USE = config.EXCHANGES_CONTRACT.UNISWAP.ROUTER;
const UNLOCKED_ACCOUNT = "0xdEAD000000000000000042069420694206942069"; // SHIB Unlocked Account
const WETH_ADDRESS = config.ARBITRAGE_TOKENS[0].for;
const ERC20_ADDRESS = config.ARBITRAGE_TOKENS[0].against;
const AMOUNT = "405000000000000"; // 40,500,000,000,000 SHIB -- Tokens will automatically be converted to wei
const GAS = 450000;

// -- SETUP ERC20 CONTRACT & TOKEN -- //
const WETH_CONTRACT = new ethers.Contract(WETH_ADDRESS, IERC20.abi, provider);
const ERC20_CONTRACT = new ethers.Contract(ERC20_ADDRESS, IERC20.abi, provider);

async function manipulatePrice(tokens: Array<Token>, account: string) {
  // const impersonatedSigner = await ethers.getImpersonatedSigner(UNLOCKED_ACCOUNT);
  await helpers.impersonateAccount(UNLOCKED_ACCOUNT);
  const impersonatedSigner = await ethers.getSigner(UNLOCKED_ACCOUNT);

  // const signer2 = provider.getSigner(UNLOCKED_ACCOUNT);

  console.log(`\nBeginning Swap...\n`);

  console.log(`Input Token: ${tokens[0].symbol}`);
  console.log(`Output Token: ${tokens[1].symbol}\n`);

  // convert from ether to wei
  const amountIn = BigNumber.from(ethers.utils.parseEther(AMOUNT));

  const path = [tokens[0].address, tokens[1].address];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  const txApproveResponse = await ERC20_CONTRACT.connect(impersonatedSigner).approve(V2_ROUTER_TO_USE.address, amountIn);
  const txApproveReceipt = await txApproveResponse.wait();
  console.log("txApproveReceipt", txApproveReceipt);

  const txSwapResponse = await V2_ROUTER_TO_USE.connect(impersonatedSigner).swapExactTokensForTokens(amountIn, 0, path, account, deadline);
  const txSwapReceipt = await txSwapResponse.wait();
  console.log("txSwapReceipt", txSwapReceipt);

  console.log(`Swap Complete!\n`);

  return txSwapReceipt;
}

const main = async () => {
  // This will be the account to recieve WETH after we perform the swap to manipulate price
  const [account, account2] = await provider.listAccounts();

  const pairContract = await getPairContract(V2_FACTORY_TO_USE, ERC20_ADDRESS, WETH_ADDRESS);

  const ERC20_TOKEN = new Token(chainId, ERC20_ADDRESS, 18, await ERC20_CONTRACT.symbol(), await ERC20_CONTRACT.name());

  const WETH_TOKEN = new Token(chainId, WETH_ADDRESS, 18, await WETH_CONTRACT.symbol(), await WETH_CONTRACT.name());

  // Fetch price of SHIB/WETH before we execute the swap
  const priceBefore = await calculatePrice(pairContract);

  await manipulatePrice([ERC20_TOKEN, WETH_TOKEN], account2);

  // Fetch price of SHIB/WETH after the swap
  const priceAfter = await calculatePrice(pairContract);

  const data = {
    "Price Before": `1 ${WETH_TOKEN.symbol} = ${Number(priceBefore).toFixed(0)} ${ERC20_TOKEN.symbol}`,
    "Price After": `1 ${WETH_TOKEN.symbol} = ${Number(priceAfter).toFixed(0)} ${ERC20_TOKEN.symbol}`,
  };

  console.table(data);

  let balance = await WETH_CONTRACT.balanceOf(account2);
  balance = ethers.utils.formatEther(balance.toString());

  console.log(`\nBalance in reciever account2: ${balance} WETH\n`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
