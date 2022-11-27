// import Web3 from "web3";
// import Big, { BigSource } from "big.js";
import { ChainId, Token } from "@uniswap/sdk";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { provider } from "../config";
import { isBigNumberOrExit } from "./general";

const IUniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json");
const IERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");
// import config from "../config";

// let web3: Web3;
// if (!config.PROJECT_SETTINGS.isLocal) {
//   web3 = new Web3(`wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
// } else {
//   web3 = new Web3("ws://127.0.0.1:8545");
//   web3.eth.net
//     .isListening()
//     .then(() => console.log("Connected to ganache blockchain"))
//     .catch((e) => console.log("********************************\n Error: You need to start ganache blockchain \n********************************"));
// }

export async function getTokenAndContract(
  _token0Address: string,
  _token1Address: string
): Promise<{
  token0Contract: Contract;
  token1Contract: Contract;
  token0: Token;
  token1: Token;
}> {
  const token0Contract = new ethers.Contract(_token0Address, IERC20.abi, provider);
  const token1Contract = new ethers.Contract(_token1Address, IERC20.abi, provider);

  const token0 = new Token(ChainId.MAINNET, _token0Address, 18, await token0Contract.symbol(), await token0Contract.name());
  const token1 = new Token(ChainId.MAINNET, _token1Address, 18, await token1Contract.symbol(), await token1Contract.name());

  return { token0Contract, token1Contract, token0, token1 };
}

export async function getPairContract(_V2Factory: Contract, _token0Address: string, _token1Address: string): Promise<Contract> {
  const pairAddress = await getPairAddress(_V2Factory, _token0Address, _token1Address);
  const pairContract = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, provider);
  return pairContract;
}

export async function getPairAddress(_V2Factory: Contract, _token0Address: string, _token1Address: string): Promise<string> {
  const pairAddress = await _V2Factory.getPair(_token0Address, _token1Address);
  return pairAddress;
}

/**
 * Get reserves for a given pair address in the same pair sort
 *
 * @export
 * @param {Contract} _pairContract
 * @return {*}  {Promise<Array<BigNumber>>}
 */
export async function getReserves(_pairContract: Contract, _token0Address: string): Promise<Array<BigNumber>> {
  const reserves = await _pairContract.getReserves();
  if ((await _pairContract.token0()) === _token0Address) {
    return [reserves.reserve0, reserves.reserve1];
  } else {
    return [reserves.reserve1, reserves.reserve0];
  }
}

export async function calculatePrice(_pairContract: Contract, _token0Address: string): Promise<BigNumber> {
  // FIXME: we need to check the number of decimal to get the correct price
  const [reserve0, reserve1] = await getReserves(_pairContract, _token0Address);
  return BigNumber.from(reserve0).div(reserve1);
}

/**
 *
 *
 * @export
 * @param {BigNumber} amount WETH
 * @param {Array<Contract>} _routerPath
 * @param {Token} _token0
 * @param {Token} _token1
 * @return {*}  {Promise<{ amountIn: BigNumber; amountOut: BigNumber }>}
 */
export async function getEstimatedReturn(amount: BigNumber, _routerPath: Array<Contract>, _token0: Token, _token1: Token): Promise<{ amountIn: BigNumber; amountOut: BigNumber }> {
  const trade1 = await _routerPath[0].getAmountsOut(amount.toString(), [_token0.address, _token1.address]);
  const trade2 = await _routerPath[1].getAmountsOut(trade1[1].toString(), [_token1.address, _token0.address]);
  return { amountIn: trade1[0], amountOut: trade2[1] };
}
