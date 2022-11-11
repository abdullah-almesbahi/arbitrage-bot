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
- **PRICE_DIFFERENCE=0.50** (Difference in price between Uniswap & Sushiswap, default is 0.50%)
- **UNITS=0** (Only used for price reporting)
- **GAS_LIMIT=600000** (Currently a hardcoded value, may need to adjust during testing)
- **GAS_PRICE=0.0093** (Currently a hardcoded value, may need to adjust during testing)
### 4. Start Hardhat node, deploy contract and start the bot
`$ npm run node:deploy:bot`

### 5. Manipulate Price
In another terminal run:
`$ npm run swap`
