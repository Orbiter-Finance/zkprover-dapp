import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import { getProvider } from "@wagmi/core"
import { ContractTransaction } from "ethers"
import { goerli, useAccount, useNetwork, useProvider } from "wagmi"

import { getContractAccountFactory } from "@/config/contracts"
import { ensureNetwork } from "@/lib/utils"
import { useErrorToast } from "./use-error-toast"

const AA_SALT = "0x0"

async function isAADeployed(aaAddress: string) {
  const code = await getProvider().getCode(aaAddress)
  return code.length > 9 // '0x' or 'undefined'
}

export const AAInfoContext = React.createContext({
  address: "",
  balance: "",

  deployStatus: 0,
  deploying: false,
  deployHash: "",

  depositedGas: "",
  depositingGas: false,
  depositedHash: "",
})

export function AAInfoProvider({ children }) {
  const errorToast = useErrorToast()

  const provider = useProvider()
  const network = useNetwork()
  const account = useAccount()

  useContext(AAInfoContext)
  const [aaInfo, setAAInfo] = useState(useContext(AAInfoContext))

  const fetchAAInfo = async () => {
    console.warn("fetchAAInfo:", new Date())

    const address = account?.address
    if (!address) return

    const _aaInfo = { ...aaInfo, address: "", balance: "", deployStatus: 0 }
    setAAInfo(_aaInfo)

    try {
      const accountFactory = await getContractAccountFactory()
      const _aaAddress =
        (await accountFactory.getAddress(address, AA_SALT)) + ""

      if (!_aaAddress) return
      ;(_aaInfo.address = _aaAddress) && setAAInfo(_aaInfo)

      await Promise.all([
        provider
          .getBalance(_aaAddress)
          .then(
            (_balance) =>
              (_aaInfo.balance = _balance + "") && setAAInfo(_aaInfo)
          ),
        isAADeployed(_aaAddress).then(
          (_flag) =>
            (_aaInfo.deployStatus = _flag ? 1 : -1) && setAAInfo(_aaInfo)
        ),
      ])
    } catch (e) {}
  }

  useEffect(() => {
    fetchAAInfo()
  }, [account.address, provider])

  const handleAADeploy = async () => {
    if (aaInfo.deploying) {
      return
    }

    const _aaInfo = { ...aaInfo, deploying: true, deployHash: "" }
    setAAInfo(_aaInfo)

    try {
      await ensureNetwork(goerli.id)

      const resp: ContractTransaction = await (
        await getContractAccountFactory()
      ).createAccount(account.address, AA_SALT)

      ;(_aaInfo.deployHash = resp.hash) && setAAInfo(_aaInfo)

      await resp.wait()
      ;(_aaInfo.deployStatus = 1) && setAAInfo(_aaInfo)
    } catch (e) {
      errorToast(e.message)
    } finally {
      ;(_aaInfo.deploying = false) && setAAInfo(_aaInfo)
    }
  }

  const value = {
    address: aaInfo.address,
    balance: aaInfo.balance,
    depositedGas: aaInfo.depositedGas,
    deployStatus: aaInfo.deployStatus,
    deploying: aaInfo.deploying,
    deployHash: aaInfo.deployHash,

    fetchAAInfo,
    handleAADeploy,
  }

  return (
    <AAInfoContext.Provider value={value}>{children}</AAInfoContext.Provider>
  )
}

// const AAInfoContext = React.createContext({
//   address: "",
//   balance: "",

//   deployStatus: 0,
//   deploying: false,
//   deployHash: "",

//   depositedGas: "",
//   depositingGas: false,
//   depositedHash: "",
// } as AAInfo)

// const fetchAAInfoStatusMap: { [key: string]: number } = {}
// export function useAAInfo(autoFetchAAInfo: boolean) {
//   const errorToast = useErrorToast()

//   const provider = useProvider()
//   const network = useNetwork()
//   const account = useAccount()

//   const cacheKey = `${account.address}_${network?.chain?.id}`

//   useContext(AAInfoContext)
//   const [aaInfo, setAAInfo] = useState({
//     address: "",
//     balance: "",

//     deployStatus: 0,
//     deploying: false,
//     deployHash: "",

//     depositedGas: "",
//     depositingGas: false,
//     depositedHash: "",
//   })

//   const fetchAAInfo = async () => {
//     console.warn("cacheKey:", cacheKey)

//     if (fetchAAInfoStatusMap[cacheKey] === 1) {
//       return
//     }

//     console.warn("fetchAAInfo:", new Date())

//     const address = account?.address
//     if (!address) return

//     fetchAAInfoStatusMap[cacheKey] = 1

//     const _aaInfo = { ...aaInfo, address: "", balance: "", deployStatus: 0 }
//     setAAInfo(_aaInfo)

//     try {
//       const accountFactory = await getContractAccountFactory()
//       const _aaAddress =
//         (await accountFactory.getAddress(address, AA_SALT)) + ""

//       if (!_aaAddress) return
//       ;(_aaInfo.address = _aaAddress) && setAAInfo(_aaInfo)

//       await Promise.all([
//         provider
//           .getBalance(_aaAddress)
//           .then(
//             (_balance) =>
//               (_aaInfo.balance = _balance + "") && setAAInfo(_aaInfo)
//           ),
//         isAADeployed(_aaAddress).then(
//           (_flag) =>
//             (_aaInfo.deployStatus = _flag ? 1 : -1) && setAAInfo(_aaInfo)
//         ),
//       ])
//     } catch (e) {}

//     fetchAAInfoStatusMap[cacheKey] = 0
//   }

//   useEffect(() => {
//     if (autoFetchAAInfo) fetchAAInfo()
//   }, [account.address, provider])

//   const handleAADeploy = async () => {
//     if (aaInfo.deploying) {
//       return
//     }

//     const _aaInfo = { ...aaInfo, deploying: true, deployHash: "" }
//     setAAInfo(_aaInfo)

//     try {
//       await ensureNetwork(goerli.id)

//       const resp: ContractTransaction = await (
//         await getContractAccountFactory()
//       ).createAccount(account.address, AA_SALT)

//       ;(_aaInfo.deployHash = resp.hash) && setAAInfo(_aaInfo)

//       await resp.wait()
//       ;(_aaInfo.deployStatus = 1) && setAAInfo(_aaInfo)
//     } catch (e) {
//       errorToast(e.message)
//     } finally {
//       ;(_aaInfo.deploying = false) && setAAInfo(_aaInfo)
//     }
//   }

//   return {
//     address: aaInfo.address,
//     balance: aaInfo.balance,
//     depositedGas: aaInfo.depositedGas,
//     deployStatus: aaInfo.deployStatus,
//     deploying: aaInfo.deploying,
//     deployHash: aaInfo.deployHash,

//     fetchAAInfo,
//     handleAADeploy,
//   }
// }
