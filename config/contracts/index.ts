import { getAccount, getProvider } from "@wagmi/core"
import { Contract, Signer } from "ethers"

import { envConfig } from "../env"
import TokenZPBAbi from "./TokenZPB.abi.json"

async function getSignerOrProvider() {
  const signer: Signer = await getAccount().connector?.getSigner()
  return signer || getProvider()
}

export async function getContractTokenZPB() {
  const signerOrProvider = await getSignerOrProvider()
  return new Contract(envConfig.addressTokenZKB, TokenZPBAbi, signerOrProvider)
}
