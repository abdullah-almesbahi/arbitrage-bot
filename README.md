# Trading Bot

## Technology Stack & Tools
- Solidity (Writing Smart Contract)
- Javascript (Bot & Testing)
- [Ethers](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [Hardhat](https://hardhat.org/docs) (Development Framework)
- [Alchemy](https://www.alchemy.com/) (For forking the Ethereum mainnet)

## Requirements For Initial Setup
- Install [NodeJS](https://nodejs.org/en/).
- Install [Hardhat](https://hardhat.org/hardhat-runner/docs/getting-started#installation).


## Setting Up
### 1. Install Dependencies:
`$ npm install`
> :warning: **Only use npm , do not use Yarn**
### 2. Get API KEY from Alchemy:
### 3. Create and Setup .env
Before running any scripts, you'll need to create a .env file with the following values (see .env.example):

- **ETH_NODE_URI**="https://eth-mainnet.alchemyapi.io/v2/apiKey"
- **MNEMONIC**="season clay citizen print travel olive umbrella cream high wrestle cupboard trash" (I use this for testing only. the first account goingto recieve profit/execute arbitrage contract)
- **CONTRACT_ADDRESS**="0xeE9F0a940f7eD451A08527Cb828B490D115dd51E" (Arbitrage contract address, it will appear to you after you deploy it)
- **PRICE_DIFFERENCE=0.50** (Difference in price between Uniswap & Sushiswap, default is 0.50%)
- **UNITS=0** (Only used for price reporting)
- **GAS_LIMIT=600000** (Currently a hardcoded value, may need to adjust during testing)
- **GAS_PRICE=0.0093** (Currently a hardcoded value, may need to adjust during testing)
### 4. Create and Setup pairs.config.js
Before running any scripts, you'll need to create a pairs.config.js file with the following values (see pairs.config.js.example):

- **for**="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" (By default we are using WETH)
- **against**="0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE" (By default we are using SHIB)
- **_unlockAddress=0xdEAD000000000000000042069420694206942069** (This is optional if you want to test locally and manipulate the pool price)
- **_swapAmount=405000000000000** (This is optional if you want to test locally and manipulate the pool price)
### 5. Start Hardhat node, deploy contract and start the bot
`$ npm run node:deploy:bot`

### 6. Manipulate Price
In another terminal run:
`$ npm run swap <PairIndexNumber>`


## MAINNET
### 1. deploy contract
`$ npm run deploy -- --network mainnet`
### 2. verify contract
`$ npm run verify -- --network mainnet`

### 2. Copy contract address and put it in .env file
CONTRACT_ADDRESS_MAINNET="0xeE9F0a940f7eD451A08527Cb828B490D115dd51E"

### 3. Run the bot
`$ npm run bot -- --network mainnet`

## GOERLI
### 1. deploy contract
`$ npm run deploy -- --network goerli`