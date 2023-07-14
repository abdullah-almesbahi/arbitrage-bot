import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import config from "../src/config";
import { getMnemonic, getPairs, node_url } from "../src/helpers/network";
import { getEstimatedReturn, getPairAddress, getPairContract, getReserves, getTokenAndContract } from "../src/helpers/blockchain";
import { BigNumber } from "@ethersproject/bignumber";
import { ChainId, Token } from "@uniswap/sdk";
import { determineProfitability } from "../src/helpers/bot";

const WETH_SHIP_PAIR_ADDRESS = "0x811beEd0119b4AfCE20D2583EB608C6F7AF1954f";

describe("Bot", function () {
  async function deployCheckArbitrageFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const CheckArbitrage = await ethers.getContractFactory("CheckArbitrage");

    const checkArbitrage = await CheckArbitrage.deploy();
    await checkArbitrage.deployed();

    const pairs = {
      for: getPairs()[0].for,
      against: getPairs()[0].against,
    };
    const { token0Contract, token1Contract, token0, token1 } = await getTokenAndContract(pairs.for, pairs.against);
    let uPair = await getPairContract(config.EXCHANGES_CONTRACT.UNISWAP.FACTORY, token0.address, token1.address);
    let sPair = await getPairContract(config.EXCHANGES_CONTRACT.SUSHISWAP.FACTORY, token0.address, token1.address);

    return { checkArbitrage };
  }
  describe("Config", function () {
    it("Check accounts addresses", async function () {
      const { checkArbitrage } = await loadFixture(deployCheckArbitrageFixture);
      // console.log("checkArbitrage", checkArbitrage);
      const isProfitable = await checkArbitrage.isProfitable(WETH_SHIP_PAIR_ADDRESS);
      console.log("isProfitable", isProfitable);
      // expect(owner.address).to.equal("0x4CFeAa82d8032FBb1Afdef0F36f392D25f82218B");
      // expect(otherAccount.address).to.equal("0x038bFDee6Aa7734c9b9f34A52cb2fC6AaeA77651");
    });
  });
});
