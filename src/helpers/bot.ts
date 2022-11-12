import { calculatePrice, getReserves, getEstimatedReturn } from "./blockchain";
import config, { provider } from "../config";
import { Token } from "@uniswap/sdk";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";

let amount: number;
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
      query.token0Contract.balanceOf(query.account),
      provider.getBalance(query.account),
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

const checkPrice = async (query: { exchange: string; token0: Token; token1: Token; uPair: Contract; sPair: Contract }): Promise<number> => {
  isExecuting = true;

  console.log(`Swap Initiated on ${query.exchange}, Checking Price...\n`);

  const [currentBlock, uPrice, sPrice] = await Promise.all([provider.getBlockNumber(), calculatePrice(query.uPair), calculatePrice(query.sPair)]);

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
  balanceBefore: BigNumber;
  ethBalanceBefore: BigNumber;
}): Promise<boolean> => {
  console.log(`Determining Profitability...\n`);

  // This is where you can customize your conditions on whether a profitable trade is possible.
  // This is a basic example of trading WETH/SHIB...

  let reserves, exchangeToBuy, exchangeToSell;
  if (query._routerPath[0].address == config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.address) {
    reserves = await getReserves(query.sPair);
    exchangeToBuy = "Uniswap";
    exchangeToSell = "Sushiswap";
  } else {
    reserves = await getReserves(query.uPair);
    exchangeToBuy = "Sushiswap";
    exchangeToSell = "Uniswap";
  }

  console.log(`Reserves on ${query._routerPath[1].address}`);
  console.log(`${query._token1.symbol}: ${Number(ethers.utils.formatEther(reserves[0].toString())).toFixed(0)}`);
  console.log(`WETH: ${ethers.utils.formatEther(reserves[1].toString())}\n`);

  try {
    // This returns the amount of WETH needed
    const result = await query._routerPath[0].getAmountsIn(reserves[0], [query._token0.address, query._token1.address]);

    const token0In = result[0]; // WETH
    const token1In = result[1]; // SHIB

    const [_result, { amountIn, amountOut }] = await Promise.all([
      query._routerPath[1].getAmountsOut(token1In, [query._token1.address, query._token0.address]),
      getEstimatedReturn(token0In, query._routerPath, query._token0, query._token1),
    ]);

    console.log(`Estimated amount of WETH needed to buy enough ${query._token1.symbol} on ${exchangeToBuy}\t\t| ${ethers.utils.formatEther(token0In)}`);
    console.log(`Estimated amount of WETH returned after swapping ${query._token1.symbol} on ${exchangeToSell}\t| ${ethers.utils.formatEther(_result[1])}\n`);

    const balanceAfter = BigNumber.from(query.ethBalanceBefore).sub(ethers.utils.parseUnits(config.GAS_PRICE.toString(), "ether"));

    const amountDifference = BigNumber.from(amountOut).sub(amountIn);
    let wethBalanceBefore = query.balanceBefore;

    const wethBalanceAfter = BigNumber.from(wethBalanceBefore).add(amountDifference).toString();
    const wethBalanceDifference = BigNumber.from(wethBalanceAfter).sub(wethBalanceBefore).toString();

    const totalGained = BigNumber.from(wethBalanceDifference).sub(ethers.utils.parseUnits(config.GAS_PRICE.toString(), "ether")).toString();

    const data = {
      "ETH Balance Before": ethers.utils.formatEther(query.ethBalanceBefore),
      "ETH Balance After": ethers.utils.formatEther(balanceAfter),
      "ETH Spent (gas)": config.GAS_PRICE,
      "-": {},
      "WETH Balance BEFORE": ethers.utils.formatEther(wethBalanceBefore),
      "WETH Balance AFTER": ethers.utils.formatEther(wethBalanceAfter),
      "WETH Gained/Lost": ethers.utils.formatEther(wethBalanceDifference),
      // @ts-ignore
      "-": {},
      "Total Gained/Lost": ethers.utils.formatEther(totalGained),
    };

    console.table(data);

    if (amountOut.lt(amountIn)) {
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
  balanceBefore: BigNumber;
  ethBalanceBefore: BigNumber;
}): Promise<void> => {
  console.log(`Attempting Arbitrage...\n`);

  let startOnUniswap;

  if (query._routerPath[0].address == config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.address) {
    startOnUniswap = true;
  } else {
    startOnUniswap = false;
  }

  if (config.PROJECT_SETTINGS.isDeployed) {
    const IArbitrage = await hre.artifacts.readArtifact("Arbitrage");
    const getSigner = provider.getSigner();
    const arbitrage = new ethers.Contract(process.env.ARBITRAGE_CONTRACT_ADDRESS as string, IArbitrage.abi, getSigner);
    const txExecuteTradeResponse = await arbitrage.executeTrade(startOnUniswap, query._token0Contract.address, query._token1Contract.address, amount.toString());
    const txExecuteTradeReceipt = await txExecuteTradeResponse.wait();
  }

  console.log(`Trade Complete:\n`);

  // Fetch token balance after
  const balanceAfter = await query._token0Contract.balanceOf(query.account);
  const ethBalanceAfter = await provider.getBalance(query.account);

  const balanceDifference = BigNumber.from(balanceAfter).sub(query.balanceBefore);
  const totalSpent = BigNumber.from(query.ethBalanceBefore).sub(ethBalanceAfter);

  const data = {
    "ETH Balance Before": ethers.utils.formatEther(query.ethBalanceBefore),
    "ETH Balance After": ethers.utils.formatEther(ethBalanceAfter),
    "ETH Spent (gas)": ethers.utils.formatEther(BigNumber.from(query.ethBalanceBefore).sub(ethBalanceAfter)),
    "-": {},
    "WETH Balance BEFORE": ethers.utils.formatEther(query.balanceBefore),
    "WETH Balance AFTER": ethers.utils.formatEther(balanceAfter),
    "WETH Gained/Lost": ethers.utils.formatEther(balanceDifference),
    // @ts-ignore
    "-": {},
    "Total Gained/Lost": `${ethers.utils.formatEther(BigNumber.from(balanceDifference).sub(totalSpent))} ETH`,
  };

  console.table(data);
};
