import { PropsWithChildren, useState } from "react"
import Head from "next/head"
import { useToast } from "@/hooks/use-toast"
import { prepareSendTransaction, sendTransaction } from "@wagmi/core"
import { parseEther } from "ethers/lib/utils.js"
import { Link2, Loader2 } from "lucide-react"
import { useAccount, useBalance, useNetwork } from "wagmi"

import { cn } from "@/lib/utils"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LinkTextProps {
  className?: string
  label?: string
  content?: string
  href?: string
  keepLeft?: number
  keepRight?: number
}
function LinkText(props: PropsWithChildren & LinkTextProps) {
  const keepLeft = props.keepLeft || 4
  const keepRight = props.keepRight || 4

  const regex = new RegExp(`^(.{${keepLeft}}).*(.{${keepRight}})$`)
  const content = props.content?.replace(regex, "$1...$2")

  return (
    <p className={cn(props.className, "flex items-center")}>
      {props.label}:&nbsp;{content}
      <a target="_blank" href={props.href} title="Open in new tab">
        <Link2 className="ml-1 h-5 w-5 cursor-pointer text-sky-500" />
      </a>
    </p>
  )
}

export default function IndexPage() {
  const setpTitleClass =
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

  const blockExplorerUrl = useNetwork().chain?.blockExplorers.default.url
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
          to: gasReceiver,
          value: parseEther(gasAmount),
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
        <title>Next.js</title>
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
            <h3 className={setpTitleClass}>1. Deploy your AA account</h3>
            <div className="flex gap-x-7">
              <div className={cardClass}>
                <p className={cardTitleClass}>EOA Address</p>
                <LinkText
                  className={cardPClass}
                  label="Address"
                  content={account.address}
                  href={`${blockExplorerUrl}/address/${account.address}`}
                />
                <p className={cardPClass}>
                  Balance:&nbsp;
                  {parseFloat(accountBalance?.data?.formatted).toFixed(4)}
                  &nbsp;ETH
                </p>
              </div>
              <div className={cardClass}>
                <p className={cardTitleClass}>AA Address</p>
                <p className={cardPClass}>Address: 0x2121...1224</p>
                <p className={cn(cardPClass, "flex")}>
                  <Button>Deploy</Button>
                </p>
              </div>
            </div>
          </div>
          <div>
            <h3 className={cn(setpTitleClass, "mt-10")}>
              2. Send transaction test
            </h3>
            <div className="flex gap-x-7">
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
                    Send Erc20
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
                    Send Eth
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
            </div>
          </div>
          <div>
            <h3 className={cn(setpTitleClass, "mt-10")}>
              3. Pay Gas for others
            </h3>
            <div className="flex gap-x-7">
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
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
