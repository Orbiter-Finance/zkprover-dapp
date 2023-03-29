import { PropsWithChildren, useEffect, useState } from "react"
import Head from "next/head"
import { useToast } from "@/hooks/use-toast"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import {
  getProvider,
  goerli,
  prepareSendTransaction,
  sendTransaction,
  switchNetwork,
} from "@wagmi/core"
import { ContractTransaction, utils } from "ethers"
import { TransactionTypes, parseEther } from "ethers/lib/utils.js"
import { Loader2 } from "lucide-react"
import { useAccount, useBalance, useNetwork, useProvider } from "wagmi"

import {
  getContractAccountFactory,
  getContractTokenZPB,
} from "@/config/contracts"
import { cn } from "@/lib/utils"
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

function useErrorToast() {
  const { toast } = useToast()
  return (description: string) => {
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description,
    })
  }
}

async function ensureNetwork(targetChainId: number) {
  const currentChainId = getProvider()?.network?.chainId
  if (currentChainId != targetChainId) {
    await switchNetwork({ chainId: targetChainId })
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
  const AA_SALT = "0x0"

  const errorToast = useErrorToast()

  const blockExplorerUrl = useNetwork().chain?.blockExplorers?.default?.url
  const provider = useProvider()
  const account = useAccount()

  const accountBalance = useBalance({ address: account.address })

  const [balanceZPB, setBalanceZPB] = useState("")
  const [faucetZPBLoading, setFaucetZPBLoading] = useState(false)
  const [faucetZPBTxHash, setFaucetZPBTxHash] = useState("")

  const [aaAddress, setAAAddress] = useState("")
  const [aaBalance, setAABalance] = useState("")
  const [aaDeployStatus, setAADeployStatus] = useState(0)
  const [aaDeploying, setAADeploying] = useState(false)
  const [aaDeployHash, setAADeployHash] = useState("")

  const fetchBalanceZPB = async () => {
    const address = account?.address
    if (!address) return

    try {
      const contract = await getContractTokenZPB()
      const balance = await contract.balanceOf(props.isAA ? aaAddress : address)

      setBalanceZPB(utils.formatEther(balance + ""))
    } catch (e) {}
  }
  const fetchAAInfo = async () => {
    const address = account?.address
    if (!address || !props.isAA) return

    setAAAddress("")
    setAABalance("")
    setAADeployStatus(0)

    try {
      const accountFactory = await getContractAccountFactory()
      const _aaAddress =
        (await accountFactory.getAddress(address, AA_SALT)) + ""

      if (!_aaAddress) return

      setAAAddress(_aaAddress)

      await Promise.all([
        provider
          .getBalance(_aaAddress)
          .then((_balance) => setAABalance(_balance + "")),
        provider.getCode(_aaAddress).then((_code) => {
          setAADeployStatus(_code.length > 9 ? 1 : -1) // '0x' or 'undefined'
        }),
      ])
    } catch (e) {}
  }

  useEffect(() => {
    if (props.isAA) {
      fetchAAInfo()
    } else {
      setBalanceZPB("")
      fetchBalanceZPB()
    }
  }, [account.address, provider])
  useEffect(() => {
    if (props.isAA) {
      setBalanceZPB("")
      fetchBalanceZPB()
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

      await resp.wait().then(fetchBalanceZPB)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setFaucetZPBLoading(false)
    }
  }

  const handleClickAADeploy = async () => {
    try {
      if (aaDeploying) {
        return
      }

      setAADeploying(true)
      setAADeployHash("")

      await ensureNetwork(goerli.id)

      const resp: ContractTransaction = await (
        await getContractAccountFactory()
      ).createAccount(account.address, AA_SALT)

      setAADeployHash(resp.hash)

      await resp.wait()

      setAADeployStatus(1)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setAADeploying(false)
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
        <Button disabled={aaDeploying} onClick={handleClickAADeploy}>
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
        <DialogFaucetETH>
          <Button className="ml-5">Faucet ETH</Button>
        </DialogFaucetETH>
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
      />
      <p className={cardPClass}>
        Balance ETH:&nbsp;
        {displayBalanceETH()}
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
    </div>
  )
}

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

  const handleClickSendErc20 = async () => {
    try {
      if (sendErc20Loading) {
        return
      }

      setSendErc20Loading(true)
      setSendErc20Hash("")

      // Todo
      const config = await prepareSendTransaction({
        request: {
          type: TransactionTypes.eip1559,
          to: erc20Receiver,
          value: parseEther(erc20Amount),
        },
      })
      const { hash } = await sendTransaction(config)

      setSendErc20Hash(hash)
    } catch (e) {
      errorToast(e.message)
    } finally {
      setSendErc20Loading(false)
    }
  }

  const handleClickSendEth = async () => {
    try {
      if (sendEthLoading) {
        return
      }

      setSendEthLoading(true)
      setSendEthHash("")

      // Todo
      const config = await prepareSendTransaction({
        request: {
          // type: TransactionTypes.eip1559,
          to: ethReceiver,
          value: parseEther(ethAmount),
        },
      })
      const { hash } = await sendTransaction(config)

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
                  <p className={cardPSmClass}>
                    Gas:<span className="ml-2">0.0004 ETH</span>
                  </p>
                  <p className={cardPSmClass}>
                    Time:<span className="ml-2">15 s</span>
                  </p>
                  <p className={cn(cardPSmClass, "mb-4")}>
                    Save gas:<span className="ml-2">30%</span>
                  </p>
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
                      label="TxHash"
                      content={sendErc20TxHash}
                      href={`${blockExplorerUrl}/tx/${sendErc20TxHash}`}
                      keepLeft={10}
                      keepRight={8}
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
                  <p className={cardPSmClass}>
                    Gas:<span className="ml-2">0.0004 ETH</span>
                  </p>
                  <p className={cardPSmClass}>
                    Time:<span className="ml-2">15 s</span>
                  </p>
                  <p className={cn(cardPSmClass, "mb-4")}>
                    Save gas:<span className="ml-2">30%</span>
                  </p>
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
                      label="TxHash"
                      content={sendEthTxHash}
                      href={`${blockExplorerUrl}/tx/${sendEthTxHash}`}
                      keepLeft={10}
                      keepRight={8}
                    />
                  )}
                </div>
              </AccountRequire>
            </div>
          </div>
          <div>
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
          </div>
        </div>
      </section>
    </Layout>
  )
}
