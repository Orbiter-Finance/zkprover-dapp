import { PropsWithChildren } from "react"
import { Link2 } from "lucide-react"

import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

interface DialogFaucetETHProps {}

export function DialogFaucetETH(
  props: PropsWithChildren & DialogFaucetETHProps
) {
  const faucets = [
    { name: "Alchemy Faucet", href: "https://goerlifaucet.com" },
    { name: "Paradigm MultiFaucet", href: "https://faucet.paradigm.xyz" },
    { name: "Görli PoW Faucet", href: "https://goerli-faucet.pk910.de" },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Faucet ETH</DialogTitle>
          <DialogDescription>
            The current network has the following faucets that can be used
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {faucets.map((item, index) => (
            <div className="space-y-1" key={index}>
              <h4 className="text-sm font-medium leading-none">
                {index + 1}.&nbsp;{item.name}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.href}
                <a
                  href={item.href}
                  title={item.name}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Link2 className="inline-block ml-2 w-5" />
                </a>
              </p>
            </div>
          ))}
        </div>
        {/* <DialogFooter>
          <DialogTrigger>
            <Button type="submit">Ok, i know</Button>
          </DialogTrigger>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
}
