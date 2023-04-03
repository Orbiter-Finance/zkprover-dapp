import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import { useErrorToast } from "@/hooks/use-error-toast"
import { getProvider } from "@wagmi/core"
import { BigNumberish, ContractTransaction, utils } from "ethers"
import { goerli, useAccount, useNetwork, useProvider } from "wagmi"

import {
  getContractAccountFactory,
  getContractEntryPoint,
} from "@/config/contracts"
import { ensureNetwork } from "@/lib/utils"

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

  fetchAAInfo: undefined as () => Promise<void>,
  handleAADeploy: undefined as () => Promise<void>,
  handleDepositGas: undefined as (value?: BigNumberish) => Promise<void>,
})

export function AAInfoProvider({ children }) {
  const errorToast = useErrorToast()

  const provider = useProvider()
  const network = useNetwork()
  const account = useAccount()

  useContext(AAInfoContext)
  const [aaInfo, setAAInfo] = useState(useContext(AAInfoContext))

  const updateAAInfo = (newValue: typeof aaInfo | Record<string, any>) => {
    setAAInfo((v) => {
      return { ...v, ...newValue }
    })
  }

  const fetchAAInfo = async () => {
    const address = account?.address
    if (!address) return

    updateAAInfo({
      address: "",
      balance: "",
      deployStatus: 0,
      depositedGas: "",
    })

    try {
      const accountFactory = await getContractAccountFactory()
      const entryPoint = await getContractEntryPoint()
      const _aaAddress =
        (await accountFactory.getAddress(address, AA_SALT)) + ""

      if (!_aaAddress) return
      updateAAInfo({ address: _aaAddress })

      await Promise.all([
        provider
          .getBalance(_aaAddress)
          .then((_balance) => updateAAInfo({ balance: _balance + "" })),
        isAADeployed(_aaAddress).then((_flag) =>
          updateAAInfo({ deployStatus: _flag ? 1 : -1 })
        ),
        entryPoint.getDepositInfo(_aaAddress).then(({ deposit }) => {
          const depositedGas = parseFloat(
            utils.formatEther(deposit + "")
          ).toFixed(5)
          updateAAInfo({ depositedGas })
        }),
      ])
    } catch (e) {}
  }

  const handleAADeploy = async () => {
    if (aaInfo.deploying) {
      return
    }

    updateAAInfo({ deploying: true, deployHash: "" })

    try {
      await ensureNetwork(goerli.id)

      const resp: ContractTransaction = await (
        await getContractAccountFactory()
      ).createAccount(account.address, AA_SALT)

      updateAAInfo({ deployHash: resp.hash })

      await resp.wait()

      updateAAInfo({ deployStatus: 1 })
    } catch (e) {
      errorToast(e.message)
    } finally {
      updateAAInfo({ deploying: false })
    }
  }

  const handleDepositGas = async (value?: BigNumberish) => {
    try {
      if (aaInfo.depositingGas) {
        return
      }

      updateAAInfo({ depositingGas: true })

      await ensureNetwork(goerli.id)

      if (!aaInfo.address) {
        throw new Error("Waitting fetch to address")
      }

      const entryPoint = await getContractEntryPoint()
      const resp = await entryPoint.depositTo(aaInfo.address, {
        value: value || utils.parseEther("0.01"),
      })

      updateAAInfo({ depositedHash: resp.hash })

      await resp.wait().then(fetchAAInfo)
    } catch (e) {
      errorToast(e.message)
    } finally {
      updateAAInfo({ depositingGas: false })
    }
  }

  const value = {
    ...aaInfo,

    fetchAAInfo,
    handleAADeploy,
    handleDepositGas,
  }

  return (
    <AAInfoContext.Provider value={value}>{children}</AAInfoContext.Provider>
  )
}
