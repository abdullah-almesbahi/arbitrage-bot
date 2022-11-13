import { BigNumber } from "@ethersproject/bignumber";

export function isBigNumberOrExit(num: BigNumber): boolean {
  if (BigNumber.isBigNumber(num)) {
    return true;
  }
  throw new Error(`${num} is not a BigNumber`);
}
