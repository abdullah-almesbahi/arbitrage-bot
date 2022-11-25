import { PairsType } from "../types";

export function node_url(networkName: string): string {
  if (networkName) {
    const uri = process.env["ETH_NODE_URI_" + networkName.toUpperCase()];
    if (uri && uri !== "") {
      return uri;
    }
  }

  if (networkName === "localhost") {
    // do not use ETH_NODE_URI
    return "http://127.0.0.1:8545";
  }

  let uri = process.env.ETH_NODE_URI;
  if (uri) {
    uri = uri.replace("{{networkName}}", networkName);
  }
  if (!uri || uri === "") {
    // throw new Error(`environment variable "ETH_NODE_URI" not configured `);
    return "";
  }
  if (uri.indexOf("{{") >= 0) {
    throw new Error(`invalid uri or network not supported by node provider : ${uri}`);
  }
  return uri;
}

export function getMnemonic(networkName?: string): string {
  if (networkName) {
    const mnemonic = process.env["MNEMONIC_" + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== "") {
      return mnemonic;
    }
  }

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic || mnemonic === "") {
    return "season clay citizen print travel olive umbrella cream high wrestle cupboard trash";
  }
  return mnemonic;
}

export function accounts(networkName?: string): { mnemonic: string; count: number } {
  return { mnemonic: getMnemonic(networkName), count: 2 };
}

export function getContractAddress(networkName: string): string {
  if (networkName) {
    const _contractAddress = process.env["CONTRACT_ADDRESS_" + networkName.toUpperCase()];
    if (_contractAddress && _contractAddress !== "") {
      return _contractAddress;
    }
  }
  const _contractAddress = process.env.CONTRACT_ADDRESS;
  if (!_contractAddress || _contractAddress === "") {
    return "";
  }
  return _contractAddress;
}

export function getPairs(): Array<PairsType> {
  let m;
  try {
    m = require("../../pairs.config");
  } catch (ex) {
    m = [
      {
        for: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        against: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", // SHIB
        _unlockAddress: "0xdEAD000000000000000042069420694206942069", // testing purpose
        _swapAmount: "405000000000000", // testing purpose
      },
    ];
  }
  return m;
}
