// SPDX-License-Identifier: MIT
pragma solidity >=0.6.6;

import "hardhat/console.sol";

// Uniswap interface and library imports
import "./libraries/UniswapV2Library.sol";
import "./libraries/SafeERC20.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IERC20.sol";

contract CheckArbitrage {
    using SafeERC20 for IERC20;

    address private constant UNISWAP_ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    function isProfitable(address _pairAddress) public view returns (bool) {
        // return IERC20(_address).balanceOf(address(this));
        address token0Address = IUniswapV2Pair(_pairAddress).token0();
        address token1Address = IUniswapV2Pair(_pairAddress).token1();
        (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        ) = IUniswapV2Pair(_pairAddress).getReserves();

        uint256 balanceBefore = msg.sender.balance;

        uint112 uniswapPrice = reserve0 / reserve1 >= 1
            ? reserve0 / reserve1
            : (1 / reserve0) * reserve1;

        address[] memory path = new address[](2);
        path[0] = token0Address;
        path[1] = token1Address;
        uint256 amountRequired = IUniswapV2Router01(UNISWAP_ROUTER)
            .getAmountsOut(reserve1, path)[1];

        uint256 amountRequired2 = IUniswapV2Router01(UNISWAP_ROUTER)
            .getAmountsIn(reserve0, path)[1];

        // uint256 balanceBefore = IERC20(token1Address).balanceOf(msg.sender);
        // uint256 balanceBefore = IERC20(0x0000000000000000000000000000000000000000).balanceOf(msg.sender);
        return true;
    }

    function getBalanceOfToken(address _address) public view returns (uint256) {
        return IERC20(_address).balanceOf(address(this));
    }
}
