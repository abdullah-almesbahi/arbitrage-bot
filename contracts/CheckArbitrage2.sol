pragma solidity ^0.6.0;

import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";
import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Factory.sol";
import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Pair.sol";
import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Library.sol";

import "https://github.com/sushiswap/sushiswap-v2-periphery/blob/master/contracts/interfaces/ISushiSwapV2Router02.sol";
import "https://github.com/sushiswap/sushiswap-v2-periphery/blob/master/contracts/interfaces/ISushiSwapV2Factory.sol";
import "https://github.com/sushiswap/sushiswap-v2-periphery/blob/master/contracts/interfaces/ISushiSwapV2Pair.sol";
import "https://github.com/sushiswap/sushiswap-v2-periphery/blob/master/contracts/interfaces/ISushiSwapV2Library.sol";

import "https://github.com/OpenZeppelin/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract ArbitrageChecker {
    using SafeMath for uint256;

    // Uniswap contracts
    IUniswapV2Router02 public uniswapRouter;
    IUniswapV2Factory public uniswapFactory;
    IUniswapV2Library public uniswapLibrary;

    // Sushiswap contracts
    ISushiSwapV2Router02 public sushiswapRouter;
    ISushiSwapV2Factory public sushiswapFactory;
    ISushiSwapV2Library public sushiswapLibrary;

    constructor(
        address _uniswapRouter,
        address _uniswapFactory,
        address _uniswapLibrary,
        address _sushiswapRouter,
        address _sushiswapFactory,
        address _sushiswapLibrary
    ) public {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        uniswapLibrary = IUniswapV2Library(_uniswapLibrary);
        sushiswapRouter = ISushiSwapV2Router02(_sushiswapRouter);
        sushiswapFactory = ISushiSwapV2Factory(_sushiswapFactory);
        sushiswapLibrary = ISushiSwapV2Library(_sushiswapLibrary);
    }

    // Calculates the profit from an arbitrage opportunity
    // by comparing the prices on Uniswap and Sushiswap for the same token pair
    // and taking into account the gas fees and slippage.
    function calculateProfit(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 slippage,
        uint256 gasPrice
    ) public view returns (uint256) {
        // Calculate the expected price of tokenB on Uniswap
        IUniswapV2Pair uniswapPair = uniswapFactory.getPair(tokenA, tokenB);
        uint256 uniswapPrice = uniswapLibrary.effectiveValue(
            uniswapPair.token0(),
            amountA,
            uniswapPair.token1()
        );

        // Calculate the expected price of tokenB on Sushiswap
        ISushiSwapV2Pair sushiswapPair = sushiswapFactory.getPair(
            tokenA,
            tokenB
        );
        uint256 sushiswapPrice = sushiswapLibrary.effectiveValue(
            sushiswapPair.token0(),
            amountA,
            sushiswapPair.token1()
        );

        // Calculate the profit by subtracting the Uniswap price from the Sushiswap price
        // and taking into account the slippage and gas fees
        uint256 profit = (sushiswapPrice.mul(10000).div(10000 + slippage)).sub(
            uniswapPrice
        );
        uint256 gasCost = gasPrice.mul(200000); // approximate gas cost of the transaction
        return profit.sub(gasCost);
    }

    // Returns the percentage difference between the prices on Uniswap and Sushiswap
    // for the same token pair, indicating whether it is profitable or not.
    function checkArbitrageOpportunity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 slippage,
        uint256 gasPrice
    ) public view returns (int256) {
        // Calculate the profit from the arbitrage opportunity
        uint256 profit = calculateProfit(
            tokenA,
            tokenB,
            amountA,
            slippage,
            gasPrice
        );

        // Calculate the percentage difference between the prices on Uniswap and Sushiswap
        IUniswapV2Pair uniswapPair = uniswapFactory.getPair(tokenA, tokenB);
        uint256 uniswapPrice = uniswapLibrary.effectiveValue(
            uniswapPair.token0(),
            amountA,
            uniswapPair.token1()
        );
        int256 percentageDifference = (profit.mul(10000).div(uniswapPrice))
            .toInt256();

        // Return the percentage difference
        return percentageDifference;
    }
}
