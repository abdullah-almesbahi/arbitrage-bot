import Web3 from 'web3';
import Big, { BigSource } from 'big.js';
import { ChainId, Token } from '@uniswap/sdk';
const IUniswapV2Pair = require('@uniswap/v2-core/build/IUniswapV2Pair.json');
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json');
import config from '../../config/index.js';
import { Contract } from '../../types.js';

let web3: Web3;
if (!config.PROJECT_SETTINGS.isLocal) {
  web3 = new Web3(`wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
} else {
  web3 = new Web3('ws://127.0.0.1:7545');
  web3.eth.net
    .isListening()
    .then(() => console.log('Connected to ganache blockchain'))
    .catch((e) =>
      console.log(
        '********************************\n Error: You need to start ganache blockchain \n********************************',
      ),
    );
}

export async function getTokenAndContract(
  _token0Address: string,
  _token1Address: string,
): Promise<{
  token0Contract: Contract;
  token1Contract: Contract;
  token0: Token;
  token1: Token;
}> {
  const token0Contract = new web3.eth.Contract(IERC20.abi, _token0Address);
  const token1Contract = new web3.eth.Contract(IERC20.abi, _token1Address);

  const token0 = new Token(
    ChainId.MAINNET,
    _token0Address,
    18,
    await token0Contract.methods.symbol().call(),
    await token0Contract.methods.name().call(),
  );

  const token1 = new Token(
    ChainId.MAINNET,
    _token1Address,
    18,
    await token1Contract.methods.symbol().call(),
    await token1Contract.methods.name().call(),
  );

  return { token0Contract, token1Contract, token0, token1 };
}

export async function getPairContract(_V2Factory: Contract, _token0: string, _token1: string): Promise<Contract> {
  const pairAddress = await getPairAddress(_V2Factory, _token0, _token1);
  const pairContract = new web3.eth.Contract(IUniswapV2Pair.abi, pairAddress);
  return pairContract;
}

async function getPairAddress(_V2Factory: Contract, _token0, _token1): Promise<string> {
  const pairAddress = await _V2Factory.methods.getPair(_token0, _token1).call();
  return pairAddress;
}

export async function getReserves(_pairContract: Contract): Promise<Array<BigSource>> {
  const reserves = await _pairContract.methods.getReserves().call();
  return [reserves.reserve0, reserves.reserve1];
}

export async function calculatePrice(_pairContract: Contract): Promise<string> {
  const [reserve0, reserve1] = await getReserves(_pairContract);
  return Big(reserve0).div(Big(reserve1)).toString();
}

export async function getEstimatedReturn(
  amount: Big,
  _routerPath: Array<Contract>,
  _token0: Token,
  _token1: Token,
): Promise<{ amountIn: BigSource; amountOut: BigSource }> {
  const trade1 = await _routerPath[0].methods.getAmountsOut(amount, [_token0.address, _token1.address]).call();
  const trade2 = await _routerPath[1].methods.getAmountsOut(trade1[1], [_token1.address, _token0.address]).call();

  const amountIn = Big(web3.utils.fromWei(trade1[0], 'ether'));
  const amountOut = Big(web3.utils.fromWei(trade2[1], 'ether'));

  return { amountIn, amountOut };
}
