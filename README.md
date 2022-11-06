# Trading Bot

## Technology Stack & Tools
- Solidity (Writing Smart Contract)
- Javascript (Bot & Testing)
- [Ethers](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [Hardhat](https://hardhat.org/docs) (Development Framework)
- [Ganache-CLI](https://github.com/trufflesuite/ganache) (For Local Blockchain)
- [Alchemy](https://www.alchemy.com/) (For forking the Ethereum mainnet)

## Requirements For Initial Setup
- Install [NodeJS](https://nodejs.org/en/).
- Install [Hardhat](https://hardhat.org/hardhat-runner/docs/getting-started#installation).
- Install [Ganache-CLI](https://github.com/trufflesuite/ganache).


## Setting Up
### 1. Install Dependencies:
`$ npm install`
### 2. Get API KEY from Alchemy:
### 3. Start Ganache CLI
In your terminal run:
```
ganache -f wss://eth-mainnet.alchemyapi.io/v2/<Your-App-Key> -m "season clay citizen print travel olive umbrella cream high wrestle cupboard trash" -u 0xdEAD000000000000000042069420694206942069 -p 7545
```
The Mnemonic provided above I used for testing only. the `-u` address for unlocking account with huge shiba inu tokens which we are going to use it to maipulate the market for helping us in testing

### 4. Create and Setup .env
Before running any scripts, you'll need to create a .env file with the following values (see .env.example):

- **ALCHEMY_API_KEY=""**
- **ARB_FOR="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"** (By default we are using WETH)
- **ARB_AGAINST="0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"** (By default we are using SHIB)
- **PRIVATE_KEY=""** (Private key of the account to recieve profit/execute arbitrage contract)
- **PRICE_DIFFERENCE=0.50** (Difference in price between Uniswap & Sushiswap, default is 0.50%)
- **UNITS=0** (Only used for price reporting)
- **GAS_LIMIT=600000** (Currently a hardcoded value, may need to adjust during testing)
- **GAS_PRICE=0.0093** (Currently a hardcoded value, may need to adjust during testing)
### 5. Migrate Smart Contracts
In a seperate terminal run:
`$ npm run deploy`

### 6. Start the Bot
`$ npm run start`

### 7. Manipulate Price
In another terminal run:
`$ npm run swap`


Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

