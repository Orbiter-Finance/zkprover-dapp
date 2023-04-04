import { BigNumberish, BytesLike, constants } from "ethers"

export type UserOperationStruct = {
  sender: string
  nonce: BigNumberish
  initCode: BytesLike
  callData: BytesLike
  callGasLimit: BigNumberish
  verificationGasLimit: BigNumberish
  preVerificationGas: BigNumberish
  maxFeePerGas: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  paymasterAndData: BytesLike
  signature: BytesLike
}

export const defaultsForUserOp: UserOperationStruct = {
  sender: constants.AddressZero,
  nonce: 0,
  initCode: "0x",
  callData: "0x",
  callGasLimit: 0,
  verificationGasLimit: 50,
  preVerificationGas: 50,
  maxFeePerGas: 0,
  maxPriorityFeePerGas: 1e9,
  paymasterAndData: "0x",
  signature: "0x",
}
