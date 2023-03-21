import { PropsWithChildren, useState } from "react"
import Head from "next/head"
import { useToast } from "@/hooks/use-toast"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { prepareSendTransaction, sendTransaction } from "@wagmi/core"
import { ethers } from "ethers"
import { TransactionTypes, parseEther } from "ethers/lib/utils.js"
import { Loader2 } from "lucide-react"
import { useAccount, useBalance, useNetwork } from "wagmi"

import { cn } from "@/lib/utils"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFaucetETH } from "@/components/zpui/dialog-faucet-eth"
import { LinkText } from "@/components/zpui/link-text"

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

export default function IndexPage() {
  const stepTitleClass =
    "text-2xl font-extrabold leading-tight tracking-tighter"
  const cardClass =
    "index-page__card mt-5 rounded-md border border-slate-200 p-6 dark:border-slate-700"
  const cardTitleClass = "font-extrabold text-center mb-4"
  const cardPClass = "mb-4"
  const cardPSmClass = "text-sm font-medium"

  const { toast } = useToast()
  const errorToast = (description: string) => {
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description,
    })
  }

  const blockExplorerUrl = useNetwork().chain?.blockExplorers?.default?.url
  const account = useAccount()
  const accountBalance = useBalance({ address: account.address })

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
          // type: TransactionTypes.eip1559,
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
                <div className={cardClass}>
                  <p className={cardTitleClass}>EOA Address</p>
                  <LinkText
                    className={cardPClass}
                    label="Address"
                    content={account.address}
                    href={`${blockExplorerUrl}/address/${account.address}`}
                  />
                  <p className={cardPClass}>
                    Balance ETH:&nbsp;
                    {parseFloat(accountBalance?.data?.formatted).toFixed(4)}
                  </p>
                  <p className={cardPClass}>
                    Balance ZKB:&nbsp;
                    {parseFloat(accountBalance?.data?.formatted).toFixed(4)}
                  </p>
                  <p className={cardPClass}>
                    <Button>Faucet ZKB</Button>
                    <DialogFaucetETH>
                      <Button className="ml-5">Faucet ETH</Button>
                    </DialogFaucetETH>
                    {/* <span className="block text-xs mt-1 text-slate-700">
                      Receive 500 ZPB and 0.005 ETH at <br />
                      the EOA address within 30 minutes
                    </span> */}
                  </p>
                </div>
                <div className={cardClass}>
                  <p className={cardTitleClass}>AA Address</p>
                  <p className={cardPClass}>Address: 0x2121...1224</p>
                  <p className={cardPClass}>Balance:&nbsp;-&nbsp;ETH</p>
                  <p className={cn(cardPClass, "flex")}>
                    <Button>Deploy</Button>
                  </p>
                </div>
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
