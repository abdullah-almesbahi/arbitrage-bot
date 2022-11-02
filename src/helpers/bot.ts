import { calculatePrice, getReserves, getEstimatedReturn } from './blockchain.js';
import config, { web3 } from '../../config/index.js';
import { Token } from '@uniswap/sdk';
import { Contract } from '../../types.js';
import Big from 'big.js';
const IArbitrage = require('../../../build/contracts/Arbitrage.json');

let amount;
let isExecuting = false;

export const onReceiveSwapEvent = async (query: {
  exchangeName: string;
  token0Contract: Contract;
  token1Contract: Contract;
  token0: Token;
  token1: Token;
  uPair: Contract;
  sPair: Contract;
  account: string;
}): Promise<void> => {
  if (!isExecuting) {
    isExecuting = true;

    const [balanceBefore, ethBalanceBefore, priceDifference] = await Promise.all([
      // Fetch token balance before
      query.token0Contract.methods.balanceOf(query.account).call(),
      web3.eth.getBalance(query.account),
      checkPrice({
        exchange: query.exchangeName,
        token0: query.token0,
        token1: query.token1,
        uPair: query.uPair,
        sPair: query.sPair,
      }),
    ]);

    const routerPath = await determineDirection(priceDifference);

    if (!routerPath) {
      console.log(`No Arbitrage Currently Available\n`);
      console.log(`-----------------------------------------\n`);
      isExecuting = false;
      return;
    }

    const isProfitable = await determineProfitability({
      _routerPath: routerPath,
      _token0Contract: query.token0Contract,
      _token0: query.token0,
      _token1: query.token1,
      uPair: query.uPair,
      sPair: query.sPair,
      account: query.account,
      balanceBefore,
      ethBalanceBefore,
    });

    console.log('isProfitable', isProfitable);

    if (!isProfitable) {
      console.log(`No Arbitrage Currently Available\n`);
      console.log(`-----------------------------------------\n`);
      isExecuting = false;
      return;
    }

    await executeTrade({
      _routerPath: routerPath,
      _token0Contract: query.token0Contract,
      _token1Contract: query.token1Contract,
      account: query.account,
      balanceBefore,
      ethBalanceBefore,
    });

    isExecuting = false;
  }
};

const checkPrice = async (query: {
  exchange: string;
  token0: Token;
  token1: Token;
  uPair: Contract;
  sPair: Contract;
}): Promise<number> => {
  isExecuting = true;

  console.log(`Swap Initiated on ${query.exchange}, Checking Price...\n`);

  const [currentBlock, uPrice, sPrice] = await Promise.all([
    web3.eth.getBlockNumber(),
    calculatePrice(query.uPair),
    calculatePrice(query.sPair),
  ]);

  const uFPrice = Number(uPrice).toFixed(config.UNITS);
  const sFPrice = Number(sPrice).toFixed(config.UNITS);
  const priceDifference = (((Number(uFPrice) - Number(sFPrice)) / Number(sFPrice)) * 100).toFixed(2);

  console.log(`Current Block: ${currentBlock}`);
  console.log(`-----------------------------------------`);
  console.log(`UNISWAP   | ${query.token1.symbol}/${query.token0.symbol}\t | ${uFPrice}`);
  console.log(`SUSHISWAP | ${query.token1.symbol}/${query.token0.symbol}\t | ${sFPrice}\n`);
  console.log(`Percentage Difference: ${priceDifference}%\n`);

  return Number(priceDifference);
};

const determineDirection = async (priceDifference: number): Promise<null | Array<Contract>> => {
  console.log(`Determining Direction...\n`);

  if (priceDifference >= config.PRICE_DIFFERENCE) {
    console.log(`Potential Arbitrage Direction:\n`);
    console.log(`Buy\t -->\t Uniswap`);
    console.log(`Sell\t -->\t Sushiswap\n`);
    return [config.EXCHANGES_CONTRACT.UNISWAP.ROUTER, config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER];
  } else if (priceDifference <= -config.PRICE_DIFFERENCE) {
    console.log(`Potential Arbitrage Direction:\n`);
    console.log(`Buy\t -->\t Sushiswap`);
    console.log(`Sell\t -->\t Uniswap\n`);
    return [config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER, config.EXCHANGES_CONTRACT.UNISWAP.ROUTER];
  } else {
    return null;
  }
};

const determineProfitability = async (query: {
  _routerPath: Array<Contract>;
  _token0Contract: Contract;
  _token0: Token;
  _token1: Token;
  uPair: Contract;
  sPair: Contract;
  account: string;
  balanceBefore: string;
  ethBalanceBefore: string;
}): Promise<boolean> => {
  console.log(`Determining Profitability...\n`);

  // This is where you can customize your conditions on whether a profitable trade is possible.
  // This is a basic example of trading WETH/SHIB...

  let reserves, exchangeToBuy, exchangeToSell;

  // @ts-ignore
  if (query._routerPath[0]._address == config.EXCHANGES_CONTRACT.UNISWAP.ROUTER._address) {
    reserves = await getReserves(query.sPair);
    exchangeToBuy = 'Uniswap';
    exchangeToSell = 'Sushiswap';
  } else {
    reserves = await getReserves(query.uPair);
    exchangeToBuy = 'Sushiswap';
    exchangeToSell = 'Uniswap';
  }

  // @ts-ignore
  console.log(`Reserves on ${query._routerPath[1]._address}`);
  console.log(`SHIB: ${Number(web3.utils.fromWei(reserves[0].toString(), 'ether')).toFixed(0)}`);
  console.log(`WETH: ${web3.utils.fromWei(reserves[1].toString(), 'ether')}\n`);

  try {
    // This returns the amount of WETH needed
    const result = await query._routerPath[0].methods
      .getAmountsIn(reserves[0], [query._token0.address, query._token1.address])
      .call();

    const token0In = result[0]; // WETH
    const token1In = result[1]; // SHIB

    const [_result, { amountIn, amountOut }] = await Promise.all([
      query._routerPath[1].methods.getAmountsOut(token1In, [query._token1.address, query._token0.address]).call(),
      getEstimatedReturn(token0In, query._routerPath, query._token0, query._token1),
    ]);

    console.log(
      `Estimated amount of WETH needed to buy enough SHIB on ${exchangeToBuy}\t\t| ${web3.utils.fromWei(token0In, 'ether')}`,
    );
    console.log(
      `Estimated amount of WETH returned after swapping SHIB on ${exchangeToSell}\t| ${web3.utils.fromWei(
        _result[1],
        'ether',
      )}\n`,
    );

    let ethBalanceBefore = query.ethBalanceBefore;
    ethBalanceBefore = web3.utils.fromWei(ethBalanceBefore, 'ether');
    const ethBalanceAfter = Number(ethBalanceBefore) - config.GAS_PRICE;

    const amountDifference = new Big(amountOut).minus(amountIn);
    let wethBalanceBefore = query.balanceBefore;
    wethBalanceBefore = web3.utils.fromWei(wethBalanceBefore, 'ether');

    const wethBalanceAfter = new Big(wethBalanceBefore).plus(amountDifference).toString();
    const wethBalanceDifference = new Big(wethBalanceAfter).minus(wethBalanceBefore).toString();

    const totalGained = new Big(wethBalanceDifference).minus(config.GAS_PRICE).toString();

    const data = {
      'ETH Balance Before': ethBalanceBefore,
      'ETH Balance After': ethBalanceAfter,
      'ETH Spent (gas)': config.GAS_PRICE,
      '-': {},
      'WETH Balance BEFORE': wethBalanceBefore,
      'WETH Balance AFTER': wethBalanceAfter,
      'WETH Gained/Lost': wethBalanceDifference,
      // @ts-ignore
      '-': {},
      'Total Gained/Lost': totalGained,
    };

    console.table(data);

    if (amountOut < amountIn) {
      return false;
    }

    amount = token0In;
    return true;
  } catch (error) {
    console.log(error);
    console.log(`\nError occured while trying to determine profitability...\n`);
    console.log(`This can typically happen because an issue with reserves, see README for more information.\n`);
    return false;
  }
};

const executeTrade = async (query: {
  _routerPath: Array<Contract>;
  _token0Contract: Contract;
  _token1Contract: Contract;
  account: string;
  balanceBefore: string;
  ethBalanceBefore: string;
}): Promise<void> => {
  console.log(`Attempting Arbitrage...\n`);

  let startOnUniswap;

  // @ts-ignore
  if (query._routerPath[0]._address == config.EXCHANGES_CONTRACT.UNISWAP.ROUTER._address) {
    startOnUniswap = true;
  } else {
    startOnUniswap = false;
  }

  if (config.PROJECT_SETTINGS.isDeployed) {
    const arbitrage = new web3.eth.Contract(IArbitrage.abi, IArbitrage.networks[1].address);
    await arbitrage.methods
      // @ts-ignore
      .executeTrade(startOnUniswap, query._token0Contract._address, query._token1Contract._address, amount)
      .send({ from: query.account, gas: config.GAS_LIMIT });
  }

  console.log(`Trade Complete:\n`);

  // Fetch token balance after
  const balanceAfter = await query._token0Contract.methods.balanceOf(query.account).call();
  const ethBalanceAfter = Big(await web3.eth.getBalance(query.account));

  const balanceDifference = new Big(balanceAfter).minus(query.balanceBefore);
  const totalSpent = new Big(query.ethBalanceBefore).minus(ethBalanceAfter);

  const data = {
    'ETH Balance Before': web3.utils.fromWei(query.ethBalanceBefore.toString(), 'ether'),
    'ETH Balance After': web3.utils.fromWei(ethBalanceAfter.toString(), 'ether'),
    'ETH Spent (gas)': web3.utils.fromWei(new Big(query.ethBalanceBefore).minus(ethBalanceAfter).toString(), 'ether'),
    '-': {},
    'WETH Balance BEFORE': web3.utils.fromWei(query.balanceBefore.toString(), 'ether'),
    'WETH Balance AFTER': web3.utils.fromWei(balanceAfter.toString(), 'ether'),
    'WETH Gained/Lost': web3.utils.fromWei(balanceDifference.toString(), 'ether'),
    // @ts-ignore
    '-': {},
    'Total Gained/Lost': `${web3.utils.fromWei(new Big(balanceDifference).minus(totalSpent).toString(), 'ether')} ETH`,
  };

  console.table(data);
};
