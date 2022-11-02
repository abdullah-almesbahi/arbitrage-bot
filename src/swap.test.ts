import * as dotenv from 'dotenv';
dotenv.config();
import Web3 from 'web3';
import { Token } from '@uniswap/sdk';
import config from '../config/index';
import { calculatePrice, getPairContract } from './helpers/blockchain';

const IUniswapV2Router02 = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json');
const IUniswapV2Factory = require('@uniswap/v2-core/build/IUniswapV2Factory.json');
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json');

// -- SETUP NETWORK & WEB3 -- //

const chainId = 1;
const web3 = new Web3('http://127.0.0.1:7545');

// -- CONFIGURE VALUES HERE -- //

const V2_FACTORY_TO_USE = config.EXCHANGES_CONTRACT.UNISWAP.FACTORY;
const V2_ROUTER_TO_USE = config.EXCHANGES_CONTRACT.UNISWAP.ROUTER;
const UNLOCKED_ACCOUNT = '0xdEAD000000000000000042069420694206942069'; // SHIB Unlocked Account
const WETH_ADDRESS = config.ARBITRAGE_TOKENS[0].for;
const ERC20_ADDRESS = config.ARBITRAGE_TOKENS[0].against;
const AMOUNT = '40500000000000'; // 40,500,000,000,000 SHIB -- Tokens will automatically be converted to wei
// const AMOUNT = '9050000000'; // 40,500,000,000,000 SHIB -- Tokens will automatically be converted to wei
const GAS = 450000;

// -- SETUP ERC20 CONTRACT & TOKEN -- //

const WETH_CONTRACT = new web3.eth.Contract(IERC20.abi, WETH_ADDRESS);
const ERC20_CONTRACT = new web3.eth.Contract(IERC20.abi, ERC20_ADDRESS);

async function manipulatePrice(tokens, account) {
  console.log(`\nBeginning Swap...\n`);

  console.log(`Input Token: ${tokens[0].symbol}`);
  console.log(`Output Token: ${tokens[1].symbol}\n`);

  // @ts-ignore
  const amountIn = new web3.utils.BN(web3.utils.toWei(AMOUNT, 'ether'));

  const path = [tokens[0].address, tokens[1].address];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  // @ts-ignore
  await ERC20_CONTRACT.methods.approve(V2_ROUTER_TO_USE._address, amountIn).send({ from: UNLOCKED_ACCOUNT });
  const receipt = await V2_ROUTER_TO_USE.methods
    .swapExactTokensForTokens(amountIn, 0, path, account, deadline)
    .send({ from: UNLOCKED_ACCOUNT, gas: GAS });

  console.log(`Swap Complete!\n`);

  return receipt;
}

const main = async () => {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[1]; // This will be the account to recieve WETH after we perform the swap to manipulate price

  const pairContract = await getPairContract(V2_FACTORY_TO_USE, ERC20_ADDRESS, WETH_ADDRESS);

  const ERC20_TOKEN = new Token(
    chainId,
    ERC20_ADDRESS,
    18,
    await ERC20_CONTRACT.methods.symbol().call(),
    await ERC20_CONTRACT.methods.name().call(),
  );

  const WETH_TOKEN = new Token(
    chainId,
    WETH_ADDRESS,
    18,
    await WETH_CONTRACT.methods.symbol().call(),
    await WETH_CONTRACT.methods.name().call(),
  );

  // Fetch price of SHIB/WETH before we execute the swap
  const priceBefore = await calculatePrice(pairContract);

  await manipulatePrice([ERC20_TOKEN, WETH_TOKEN], account);

  // Fetch price of SHIB/WETH after the swap
  const priceAfter = await calculatePrice(pairContract);

  const data = {
    'Price Before': `1 ${WETH_TOKEN.symbol} = ${Number(priceBefore).toFixed(0)} ${ERC20_TOKEN.symbol}`,
    'Price After': `1 ${WETH_TOKEN.symbol} = ${Number(priceAfter).toFixed(0)} ${ERC20_TOKEN.symbol}`,
  };

  console.table(data);

  let balance = await WETH_CONTRACT.methods.balanceOf(account).call();
  balance = web3.utils.fromWei(balance.toString(), 'ether');

  console.log(`\nBalance in reciever account: ${balance} WETH\n`);
};

main();
