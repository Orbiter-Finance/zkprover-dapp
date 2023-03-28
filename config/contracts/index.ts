import { getAccount, getProvider } from "@wagmi/core"
import { Contract, Signer } from "ethers"

import { envConfig } from "../env"
import AccountFactoryAbi from "./AccountFactory.abi.json"
import TokenZPBAbi from "./TokenZPB.abi.json"
import EntryPointAbi from "./EntryPoint.abi.json"

async function getSignerOrProvider() {
  const signer: Signer = await getAccount().connector?.getSigner()
  return signer || getProvider()
}

export async function getContractTokenZPB() {
  const signerOrProvider = await getSignerOrProvider()
  return new Contract(envConfig.addressTokenZKB, TokenZPBAbi, signerOrProvider)
}

export async function getContractAccountFactory() {
  const signerOrProvider = await getSignerOrProvider()
  return new Contract(
    envConfig.addressAccountFactory,
    AccountFactoryAbi,
    signerOrProvider
  )
}

export async function getContractEntryPoint() {
  const signerOrProvider = await getSignerOrProvider()
  return new Contract(
    envConfig.addressEntryPoint,
    EntryPointAbi,
    signerOrProvider
  )
}
