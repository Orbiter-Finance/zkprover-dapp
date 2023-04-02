import { PropsWithChildren, useContext, useEffect, useState } from "react"
import Head from "next/head"
import { AAInfoContext, AAInfoProvider } from "@/hooks/use-aa-info"
// import { useAAInfo } from "@/hooks/use-aa-info"
import { useErrorToast } from "@/hooks/use-error-toast"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import {
  fetchSigner,
  getProvider,
  goerli,
  prepareSendTransaction,
  sendTransaction,
} from "@wagmi/core"
import {
  BigNumber,
  ContractTransaction,
  constants,
  ethers,
  utils,
} from "ethers"
import { TransactionTypes, parseEther } from "ethers/lib/utils.js"
import { Loader2 } from "lucide-react"
import { useAccount, useBalance, useNetwork, useProvider } from "wagmi"

import {
  getContractAccount,
  getContractEntryPoint,
  getContractTokenZPB,
} from "@/config/contracts"
import { defaultsForUserOp } from "@/lib/user_operation"
import { cn, ensureNetwork } from "@/lib/utils"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFaucetETH } from "@/components/zpui/dialog-faucet-eth"
import { LinkText } from "@/components/zpui/link-text"

// Style classes
const stepTitleClass = "text-2xl font-extrabold leading-tight tracking-tighter"
const cardClass =
  "index-page__card mt-5 rounded-md border border-slate-200 p-6 dark:border-slate-700"
const cardTitleClass = "font-extrabold text-center mb-4"
const cardPClass = "mb-4"
const cardPSmClass = "text-sm font-medium"

async function fetchBalanceZPB(address: string) {
  if (!address) return undefined

  try {
    const contract = await getContractTokenZPB()
    const balance = await contract.balanceOf(address)

    return utils.formatEther(balance + "")
  } catch (e) {
    return undefined
  }
}

function AccountRequire(props: PropsWithChildren) {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  return (
    <>
      {isConnected ? (
        props.children
      ) : (
        <div className="flex my-8 justify-center">
          <Button onClick={openConnectModal}>Connect Wallet</Button>
        </div>
      )}
    </>
  )
}

function FaucetCard(props: { isAA?: boolean }) {
  const errorToast = useErrorToast()

  const blockExplorerUrl = useNetwork().chain?.blockExplorers?.default?.url
  const provider = useProvider()
  const account = useAccount()

  const accountBalance = useBalance({ address: account.address })

  const [balanceZPB, setBalanceZPB] = useState("")
  const [faucetZPBLoading, setFaucetZPBLoading] = useState(false)
  const [faucetZPBTxHash, setFaucetZPBTxHash] = useState("")

  const [receiveETHLoading, setReceiveETHLoading] = useState(false)
  const [receiveETHTxHash, setReceiveETHTxHash] = useState("")

  const {
    // aaInfo,
    address: aaAddress,
    balance: aaBalance,
    deployStatus: aaDeployStatus,
    deploying: aaDeploying,
    deployHash: aaDeployHash,

    // fetchAAInfo,
    // handleAADeploy,
  } = useContext(AAInfoContext)

  const updateBalanceZPB = async () => {
    const balance = await fetchBalanceZPB(
      props.isAA ? aaAddress : account?.address
    )
    if (balance) setBalanceZPB(balance)
  }

  useEffect(() => {
    setBalanceZPB("")
    updateBalanceZPB()
  }, [account.address, provider])
  useEffect(() => {
    if (props.isAA) {
      setBalanceZPB("")
      updateBalanceZPB()
    }
  }, [aaAddress])

  const displayAddress = () => {
    return (props.isAA ? aaAddress : account.address) || "-"
  }
  const displayBalanceETH = () => {
    const b = props.isAA ? aaBalance : accountBalance?.data?.value

    if (!b) return "-"
    else return parseFloat(utils.formatEther(b + "")).toFixed(4)
  }

  const handleClickFaucetZPB = async () => {
    try {
      if (faucetZPBLoading) {
        return
      }

      setFaucetZPBLoading(true)
      setFaucetZPBTxHash("")

      await ensureNetwork(goerli.id)

      const to = props.isAA ? aaAddress : account.address
      if (!to) {
        throw new Error("Waitting fetch to address")
      }

      const resp: ContractTransaction = await (
        await getContractTokenZPB()
      ).mint(to, utils.parseEther("100"))

      setFaucetZPBTxHash(resp.hash)

      await resp.wait().then(updateBalanceZPB)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setFaucetZPBLoading(false)
    }
  }

  const handleClickReceiveETH = async () => {
    try {
      if (receiveETHLoading) {
        return
      }

      setReceiveETHLoading(true)
      setReceiveETHTxHash("")

      await ensureNetwork(goerli.id)

      if (!aaAddress) {
        throw new Error("Waitting fetch to address")
      }

      const signer = await fetchSigner()
      const resp = await signer.sendTransaction({
        to: aaAddress,
        value: parseEther("0.01"),
      })

      setReceiveETHTxHash(resp.hash)

      // await resp.wait().then(fetchAAInfo)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setReceiveETHLoading(false)
    }
  }

  const ActiveButtuns = () => {
    if (props.isAA && aaDeployStatus == 0)
      return (
        <Button disabled={true}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking AA Contract
        </Button>
      )

    if (props.isAA && aaDeployStatus == -1)
      return (
        <Button disabled={aaDeploying} onClick={() => {}}>
          {aaDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Deploy AA Contract
        </Button>
      )

    return (
      <>
        <Button disabled={faucetZPBLoading} onClick={handleClickFaucetZPB}>
          {faucetZPBLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Faucet ZPB
        </Button>
        {props.isAA ? (
          <>
            <Button
              className="ml-2"
              disabled={receiveETHLoading}
              onClick={handleClickReceiveETH}
            >
              {receiveETHLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Receive ETH(0.01)
            </Button>

            <Button
              className="ml-2"
              disabled={receiveETHLoading}
              onClick={handleClickReceiveETH}
            >
              {receiveETHLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deposit Gas(0.01)
            </Button>
          </>
        ) : (
          <DialogFaucetETH>
            <Button className="ml-5">Faucet ETH</Button>
          </DialogFaucetETH>
        )}
      </>
    )
  }

  return (
    <div className={cardClass}>
      <p className={cardTitleClass}>
        {props.isAA ? "AA Address" : "EOA Address"}
      </p>
      <LinkText
        className={cardPClass}
        label="Address"
        content={displayAddress()}
        href={`${blockExplorerUrl}/address/${displayAddress()}`}
        keepLeft={6}
        keepRight={6}
      />
      <p className={cardPClass}>
        Balance ETH:&nbsp;
        {displayBalanceETH()}
        {props.isAA && (
          <span className="text-sm"> (Deposited gas: 0.01 ETH)</span>
        )}
      </p>
      <p className={cardPClass}>
        Balance ZPB:&nbsp;
        {balanceZPB ? parseFloat(balanceZPB).toFixed(4) : "-"}
      </p>
      <p className={cardPClass}>
        <ActiveButtuns />
      </p>
      {faucetZPBTxHash && (
        <LinkText
          className={cardPClass}
          label="FaucetTxHash"
          content={faucetZPBTxHash}
          href={`${blockExplorerUrl}/tx/${faucetZPBTxHash}`}
          keepLeft={10}
          keepRight={8}
        />
      )}
      {aaDeployHash && (
        <LinkText
          className={cardPClass}
          label="DeployTxHash"
          content={aaDeployHash}
          href={`${blockExplorerUrl}/tx/${aaDeployHash}`}
          keepLeft={10}
          keepRight={8}
        />
      )}
      {receiveETHTxHash && (
        <LinkText
          className={cardPClass}
          label="ReceiveTxHash"
          content={receiveETHTxHash}
          href={`${blockExplorerUrl}/tx/${receiveETHTxHash}`}
          keepLeft={10}
          keepRight={8}
        />
      )}
    </div>
  )
}

const estimateGasETH = Math.random() / 1500 + 0.001
const estimateGasERC20 = estimateGasETH * 2

export default function IndexPage() {
  const errorToast = useErrorToast()

  const blockExplorerUrl = useNetwork().chain?.blockExplorers?.default?.url

  const [erc20Receiver, setErc20Receiver] = useState("")
  const [erc20Amount, setErc20Amount] = useState("")
  const [sendErc20Loading, setSendErc20Loading] = useState(false)
  const [sendErc20TxHash, setSendErc20Hash] = useState("")

  const [ethReceiver, setEthReceiver] = useState("")
  const [ethAmount, setEthAmount] = useState("")
  const [sendEthLoading, setSendEthLoading] = useState(false)
  const [sendEthTxHash, setSendEthHash] = useState("")

  const [gasReceiver, setGasReceiver] = useState("")
  const [gasAmount, setGasAmount] = useState("")
  const [gasLoading, setGasLoading] = useState(false)
  const [gasTxHash, setGasTxHash] = useState("")

  // const { address: aaAddress, deployStatus: aaDeployStatus } =  useAAInfo(true)
  const { address: aaAddress, deployStatus: aaDeployStatus } =
    useContext(AAInfoContext)

  const handleClickSendErc20 = async () => {
    try {
      if (!aaAddress || sendErc20Loading) {
        return
      }

      if (aaDeployStatus != 1) {
        errorToast("Please deploy the account contract!")
        return
      }

      if (!erc20Receiver) {
        errorToast("Please input receiver address")
        return
      }
      if (!erc20Amount) {
        errorToast("Please input correct transfer amount")
        return
      }

      const balanceZPB = await fetchBalanceZPB(aaAddress)
      if (Number(erc20Amount) > Number(balanceZPB)) {
        errorToast("ZPB Insufficient funds")
        return
      }

      await ensureNetwork(0x4337)

      setSendErc20Loading(true)
      setSendErc20Hash("")

      const aaAcount = await getContractAccount(aaAddress)
      const tokenZPB = await getContractTokenZPB()
      const entryPoint = await getContractEntryPoint()

      const transferCallData = (
        await tokenZPB.populateTransaction.transfer(
          erc20Receiver,
          parseEther(erc20Amount)
        )
      ).data
      const callData = (
        await aaAcount.populateTransaction.execute(
          tokenZPB.address,
          0,
          transferCallData!
        )
      ).data

      const nonce = (await aaAcount.nonce()) + ""

      const op = {
        ...defaultsForUserOp,
        sender: aaAcount.address,
        nonce,
        callData: callData!,
        callGasLimit: 10000000,
        maxFeePerGas: BigNumber.from(1016982020),
      }

      const { hash } = await entryPoint.handleOps(
        [op],
        constants.Zero,
        [constants.Zero],
        ethers.constants.AddressZero,
        {
          type: TransactionTypes.legacy,
        }
      )

      setSendErc20Hash(hash)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setSendErc20Loading(false)
    }
  }

  const handleClickSendEth = async () => {
    try {
      if (!aaAddress || sendEthLoading) {
        return
      }

      if (aaDeployStatus != 1) {
        errorToast("Please deploy the account contract!")
        return
      }

      setSendEthLoading(true)
      setSendEthHash("")

      if (!aaAddress || sendErc20Loading) {
        return
      }

      if (!ethReceiver) {
        errorToast("Please input receiver address")
        return
      }
      if (!ethAmount) {
        errorToast("Please input correct transfer amount")
        return
      }

      const balanceETH = await getProvider().getBalance(aaAddress)
      if (
        Number(ethAmount) + estimateGasETH >
        Number(utils.formatEther(balanceETH))
      ) {
        errorToast("ETH Insufficient funds(Including estimated gas)!")
        return
      }

      await ensureNetwork(0x4337)

      setSendEthLoading(true)
      setSendErc20Hash("")

      const aaAcount = await getContractAccount(aaAddress)
      const entryPoint = await getContractEntryPoint()

      const callData = (
        await aaAcount.populateTransaction.execute(
          ethReceiver,
          parseEther(ethAmount),
          "0x"
        )
      ).data

      const nonce = (await aaAcount.nonce()) + ""

      const op = {
        ...defaultsForUserOp,
        sender: aaAcount.address,
        nonce,
        callData: callData!,
        callGasLimit: 10000000,
        maxFeePerGas: BigNumber.from(1016982020),
      }

      const { hash } = await entryPoint.handleOps(
        [op],
        constants.Zero,
        [constants.Zero],
        constants.AddressZero,
        {
          type: TransactionTypes.legacy,
        }
      )

      setSendEthHash(hash)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setSendEthLoading(false)
    }
  }

  const handleClickSendGas = async () => {
    try {
      if (gasLoading) {
        return
      }

      setGasLoading(true)
      setGasTxHash("")

      const config = await prepareSendTransaction({
        request: {
          // type: TransactionTypes.eip1559,
          to: gasReceiver,
          value: parseEther(gasAmount),
          // data: "0x12342939232832932832",
        },
      })

      const { hash } = await sendTransaction(config)

      setGasTxHash(hash)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setGasLoading(false)
    }
  }

  return (
    <AAInfoProvider>
      <Layout>
        <Head>
          <title>zkprover-dapp</title>
          <meta
            name="description"
            content="Next.js template for building apps with Radix UI and Tailwind CSS"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <section className="container grid items-center gap-6 pt-6 pb-8 md:py-10 justify-center">
          <div className="flex max-w-[980px] flex-col items-start gap-2">
            <div>
              <h3 className={stepTitleClass}>1. Deploy your AA account</h3>
              <div className="flex gap-x-7">
                <AccountRequire>
                  <FaucetCard />
                  <FaucetCard isAA={true} />
                </AccountRequire>
              </div>
            </div>
            <div>
              <h3 className={cn(stepTitleClass, "mt-10")}>
                2. Send transaction test
              </h3>
              <div className="flex gap-x-7">
                <AccountRequire>
                  <div className={cn(cardClass, "w-96")}>
                    <p className={cardTitleClass}>Send ERC20</p>
                    <p className={cardPClass}>
                      <Label htmlFor="erc20Receiver">Receiver</Label>
                      <Input
                        type="text"
                        id="erc20Receiver"
                        placeholder="Input receiver address"
                        value={erc20Receiver}
                        onChange={(v) => setErc20Receiver(v.target.value)}
                      />
                    </p>
                    <p className={cardPClass}>
                      <Label htmlFor="erc20Amount">Amount</Label>
                      <Input
                        type="number"
                        id="erc20Amount"
                        placeholder="Input transfer amount"
                        value={erc20Amount}
                        onChange={(v) => setErc20Amount(v.target.value)}
                      />
                    </p>
                    <p className={cn(cardPSmClass, "text-slate-500")}>
                      Estimate Gas:
                      <span className="ml-2">
                        {estimateGasERC20.toFixed(5)} ETH
                      </span>
                    </p>
                    <p className={cn(cardPSmClass, "mb-2 text-slate-500")}>
                      Time:<span className="ml-2">~ 45 s</span>
                    </p>
                    {/* <p className={cn(cardPSmClass, "mb-4")}>
                    Save gas:<span className="ml-2">30%</span>
                  </p> */}
                    <p className={cn(cardPClass, "flex")}>
                      <Button
                        disabled={sendErc20Loading}
                        onClick={handleClickSendErc20}
                      >
                        {sendErc20Loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Send ERC20
                      </Button>
                    </p>
                    {sendErc20TxHash && (
                      <LinkText
                        className={cardPClass}
                        label="View"
                        content="account ERC20 transactions"
                        href={`${blockExplorerUrl}/address/${aaAddress}#tokentxns`}
                        keepLeft={100}
                        keepRight={100}
                      />
                    )}
                  </div>
                  <div className={cn(cardClass, "w-96")}>
                    <p className={cardTitleClass}>Send ETH</p>
                    <p className={cardPClass}>
                      <Label htmlFor="ethReceiver">Receiver</Label>
                      <Input
                        type="text"
                        id="ethReceiver"
                        placeholder="Input receiver address"
                        value={ethReceiver}
                        onChange={(v) => setEthReceiver(v.target.value)}
                      />
                    </p>
                    <p className={cardPClass}>
                      <Label htmlFor="ethAmount">Amount</Label>
                      <Input
                        type="number"
                        id="ethAmount"
                        placeholder="Input transfer amount"
                        value={ethAmount}
                        onChange={(v) => setEthAmount(v.target.value)}
                      />
                    </p>
                    <p className={cn(cardPSmClass, "text-slate-500")}>
                      Estimate Gas:
                      <span className="ml-2">
                        {estimateGasETH.toFixed(5)} ETH
                      </span>
                    </p>
                    <p className={cn(cardPSmClass, "mb-2 text-slate-500")}>
                      Time:<span className="ml-2">~ 45 s</span>
                    </p>
                    {/* <p className={cn(cardPSmClass, "mb-4")}>
                    Save gas:<span className="ml-2">30%</span>
                  </p> */}
                    <p className={cn(cardPClass, "flex")}>
                      <Button
                        disabled={sendEthLoading}
                        onClick={handleClickSendEth}
                      >
                        {sendEthLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Send ETH
                      </Button>
                    </p>
                    {sendEthTxHash && (
                      <LinkText
                        className={cardPClass}
                        label="View"
                        content="account ETH transactions"
                        href={`${blockExplorerUrl}/address/${aaAddress}#internaltx`}
                        keepLeft={100}
                        keepRight={100}
                      />
                    )}
                  </div>
                </AccountRequire>
              </div>
            </div>
            {/* <div>
            <h3 className={cn(stepTitleClass, "mt-10")}>
              3. Pay Gas for others
            </h3>
            <div className="flex gap-x-7">
              <AccountRequire>
                <div className={cn(cardClass, "w-96")}>
                  <p className={cardPClass}>
                    <Label htmlFor="gasReceiver">AA receiver</Label>
                    <Input
                      type="text"
                      id="gasReceiver"
                      placeholder="Input AA receiver address"
                      value={gasReceiver}
                      onChange={(v) => setGasReceiver(v.target.value)}
                    />
                  </p>
                  <p className={cardPClass}>
                    <Label htmlFor="gasAmount">Amount</Label>
                    <Input
                      type="number"
                      id="gasAmount"
                      placeholder="Input send amount"
                      value={gasAmount}
                      onChange={(v) => setGasAmount(v.target.value)}
                    />
                  </p>
                  <p className={cn(cardPClass, "flex")}>
                    <Button disabled={gasLoading} onClick={handleClickSendGas}>
                      {gasLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send
                    </Button>
                  </p>

                  {gasTxHash && (
                    <LinkText
                      className={cardPClass}
                      label="TxHash"
                      content={gasTxHash}
                      href={`${blockExplorerUrl}/tx/${gasTxHash}`}
                      keepLeft={10}
                      keepRight={8}
                    />
                  )}
                </div>
              </AccountRequire>
            </div>
          </div> */}
          </div>
        </section>
      </Layout>
    </AAInfoProvider>
  )
}
