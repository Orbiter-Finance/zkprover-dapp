import { PropsWithChildren } from "react"

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

interface DialogFaucetETHProops {}

export function DialogFaucetETH(
  props: PropsWithChildren & DialogFaucetETHProops
) {
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
        <div className="grid gap-4 py-4"></div>
        <DialogFooter>
          <Button type="submit">I know</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
