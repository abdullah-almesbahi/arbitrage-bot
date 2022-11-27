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

describe("Bot", function () {
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");

    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    const pairs = {
      for: getPairs()[0].for,
      against: getPairs()[0].against,
    };
    const { token0Contract, token1Contract, token0, token1 } = await getTokenAndContract(pairs.for, pairs.against);
    let uPair = await getPairContract(config.EXCHANGES_CONTRACT.UNISWAP.FACTORY, token0.address, token1.address);
    let sPair = await getPairContract(config.EXCHANGES_CONTRACT.SUSHISWAP.FACTORY, token0.address, token1.address);

    return { lock, unlockTime, lockedAmount, owner, otherAccount, pairs, token0Contract, token1Contract, token0, token1, uPair, sPair };
  }
  describe("Config", function () {
    it("Check accounts addresses", async function () {
      const { owner, otherAccount } = await loadFixture(deployOneYearLockFixture);
      expect(owner.address).to.equal("0x4CFeAa82d8032FBb1Afdef0F36f392D25f82218B");
      expect(otherAccount.address).to.equal("0x038bFDee6Aa7734c9b9f34A52cb2fC6AaeA77651");
    });
    it("Check exchange addresses", async function () {
      expect(config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.address).to.equal("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
      expect(config.EXCHANGES_CONTRACT.UNISWAP.FACTORY.address).to.equal("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
      expect(config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER.address).to.equal("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
      expect(config.EXCHANGES_CONTRACT.SUSHISWAP.FACTORY.address).to.equal("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac");
    });
    it("Check paris", async function () {
      const { pairs } = await loadFixture(deployOneYearLockFixture);
      expect(pairs.for).to.equal("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
      expect(pairs.against).to.equal("0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE");
    });
  });

  describe("Helper functions", function () {
    it("Check node_url", async function () {
      expect(node_url("mainnet")).to.equal(process.env.ETH_NODE_URI_MAINNET);
      expect(node_url("goerli")).to.equal(process.env.ETH_NODE_URI_GOERLI);
      expect(node_url("none")).to.equal(process.env.ETH_NODE_URI);
      expect(node_url("")).to.equal(process.env.ETH_NODE_URI);
    });
    it("Check getMnemonic", async function () {
      expect(getMnemonic("mainnet")).to.equal(process.env.MNEMONIC_MAINNET);
      expect(getMnemonic("goerli")).to.equal(process.env.MNEMONIC_GOERLI);
      expect(getMnemonic("none")).to.equal(process.env.MNEMONIC);
      expect(getMnemonic("")).to.equal(process.env.MNEMONIC);
    });
    it("Check getEstimatedReturn", async function () {
      const amount = BigNumber.from("10000");
      const routerPath = [config.EXCHANGES_CONTRACT.UNISWAP.ROUTER, config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER];
      const { token0, token1 } = await loadFixture(deployOneYearLockFixture);
      const { amountIn, amountOut } = await getEstimatedReturn(amount, routerPath, token0, token1);
      // amountIn BigNumber { value: "10000" }
      // amountOut BigNumber { value: "9955" }
      expect(BigNumber.isBigNumber(amountIn)).to.be.true;
      expect(BigNumber.isBigNumber(amountOut)).to.be.true;
    });
    it("Check getTokenAndContract", async function () {});
    it("Check getPairContract", async function () {});
    it("Check getPairAddress", async function () {
      const { token0, token1 } = await loadFixture(deployOneYearLockFixture);
      const address = await getPairAddress(config.EXCHANGES_CONTRACT.UNISWAP.FACTORY, token0.address, token1.address);
      const address2 = await getPairAddress(config.EXCHANGES_CONTRACT.SUSHISWAP.FACTORY, token0.address, token1.address);
      expect(address).to.equal("0x811beEd0119b4AfCE20D2583EB608C6F7AF1954f");
      expect(address2).to.equal("0x24D3dD4a62e29770cf98810b09F89D3A90279E7a");
    });
    it("Check getReserves", async function () {
      const { uPair, sPair, token0, token1 } = await loadFixture(deployOneYearLockFixture);
      const reserves = await getReserves(uPair, token0.address);
      const reserves2 = await getReserves(sPair, token0.address);
      console.log("reserves", reserves);

      //result1 [ BigNumber { value: "1" }, BigNumber { value: "130015367" } ]
      console.log("result1", await config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.getAmountsOut("424735096773033643055", [token0.address, token1.address]));
      console.log("result2", await config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.getAmountsIn("55388254629344785323974346504", [token0.address, token1.address]));
      // console.log("result2", result2);
      // const result1 = await config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.getAmountsIn("10000", [token0.address, token1.address]);
      // console.log("result1", result1);
      // const result2 = await config.EXCHANGES_CONTRACT.UNISWAP.ROUTER.getAmountsIn("10000", [token1.address, token0.address]);
      // console.log("result2", result2);

      //       result1 [ BigNumber { value: "1" }, BigNumber { value: "1000" } ]
      // result2 [ BigNumber { value: "130798984614" }, BigNumber { value: "1000" } ]
      expect(BigNumber.isBigNumber(reserves[0])).to.be.true;
      expect(BigNumber.isBigNumber(reserves[1])).to.be.true;
      expect(BigNumber.isBigNumber(reserves2[0])).to.be.true;
      expect(BigNumber.isBigNumber(reserves2[1])).to.be.true;
    });
    it("Check calculatePrice", async function () {});
    it("Check getEstimatedReturn", async function () {
      const { token0, token1 } = await loadFixture(deployOneYearLockFixture);
      const amount = BigNumber.from("10000000");
      const uReturn = await getEstimatedReturn(amount, [config.EXCHANGES_CONTRACT.UNISWAP.ROUTER, config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER], token0, token1);
      const sReturn = await getEstimatedReturn(amount, [config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER, config.EXCHANGES_CONTRACT.UNISWAP.ROUTER], token0, token1);
      expect(amount).to.equal(uReturn.amountIn);
      expect(BigNumber.isBigNumber(uReturn.amountIn)).to.be.true;
      expect(BigNumber.isBigNumber(uReturn.amountOut)).to.be.true;
      expect(amount).to.equal(sReturn.amountIn);
      expect(BigNumber.isBigNumber(sReturn.amountIn)).to.be.true;
      expect(BigNumber.isBigNumber(sReturn.amountOut)).to.be.true;
    });
  });
  describe("Bots main functions", function () {
    it("Check checkPrice", async function () {});
    it("Check determineDirection", async function () {});
    it("Check determineProfitability", async function () {
      const { token0, token1, token0Contract, uPair, sPair } = await loadFixture(deployOneYearLockFixture);
      const test1 = await determineProfitability({
        _routerPath: [config.EXCHANGES_CONTRACT.UNISWAP.ROUTER, config.EXCHANGES_CONTRACT.SUSHISWAP.ROUTER],
        _token0Contract: token0Contract,
        _token0: token0,
        _token1: token1,
        uPair,
        sPair,
        balanceBefore: BigNumber.from(1000),
        ethBalanceBefore: BigNumber.from(1000),
      });
      expect(test1).to.be.false;
    });
    it("Check executeTrade", async function () {});
  });
});
