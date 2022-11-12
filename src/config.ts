// const HDWalletProvider = require("@truffle/hdwallet-provider");
const IUniswapV2Router02 = require("@uniswap/v2-periphery/build/IUniswapV2Router02.json");
const IUniswapV2Factory = require("@uniswap/v2-core/build/IUniswapV2Factory.json");
import { JsonRpcProvider } from "@ethersproject/providers/src.ts/json-rpc-provider";
import { ethers } from "hardhat";

let provider: JsonRpcProvider;

const isLocal = true;
const isDeployed = true;

if (!isLocal) {
  // const provider = new ethers.providers.JsonRpcProvider();
  // const provider = new HDWalletProvider({
  //   privateKeys: [process.env.PRIVATE_KEY],
  //   providerOrUrl: `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  // });
  provider = new ethers.providers.AlchemyWebSocketProvider("mainnet", process.env.ALCHEMY_API_KEY);
  new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
  // web3 = new Web3(provider);
} else {
  provider = new ethers.providers.WebSocketProvider("ws://127.0.0.1:8545", { chainId: 31337, name: "unknown" });
}

export const exchangesForkedUniswapV2 = {
  UNISWAP: {
    V2_ROUTER_02_ADDRESS: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    FACTORY_ADDRESS: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  },
  SUSHISWAP: {
    V2_ROUTER_02_ADDRESS: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    FACTORY_ADDRESS: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
  },
};
const exchangesForkedUniswapV2Contract = {
  UNISWAP: {
    ROUTER: new ethers.Contract(exchangesForkedUniswapV2.UNISWAP.V2_ROUTER_02_ADDRESS, IUniswapV2Router02.abi, provider),
    FACTORY: new ethers.Contract(exchangesForkedUniswapV2.UNISWAP.FACTORY_ADDRESS, IUniswapV2Factory.abi, provider),
  },
  SUSHISWAP: {
    ROUTER: new ethers.Contract(exchangesForkedUniswapV2.SUSHISWAP.V2_ROUTER_02_ADDRESS, IUniswapV2Router02.abi, provider),
    FACTORY: new ethers.Contract(exchangesForkedUniswapV2.SUSHISWAP.FACTORY_ADDRESS, IUniswapV2Factory.abi, provider),
  },
};

export default {
  PROJECT_SETTINGS: {
    isLocal: isLocal,
    isDeployed: isDeployed,
  },
  EXCHANGES_ADDRESS: exchangesForkedUniswapV2,
  EXCHANGES_CONTRACT: exchangesForkedUniswapV2Contract,
  UNITS: Number(process.env.UNITS || 0), // Used for price display/reporting
  PRICE_DIFFERENCE: Number(process.env.PRICE_DIFFERENCE || 0.5), // if the price greater or equal than this, will excute the trade
  GAS_LIMIT: Number(process.env.GAS_LIMIT || 600000),
  GAS_PRICE: Number(process.env.GAS_PRICE || 0.0093), // Estimated Gas: 0.008453220000006144 ETH + ~10%
};

export { provider };
