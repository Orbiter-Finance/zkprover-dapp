import { getProvider, switchNetwork } from "@wagmi/core"
import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function ensureNetwork(targetChainId: number) {
  const currentChainId = getProvider()?.network?.chainId
  if (currentChainId != targetChainId) {
    await switchNetwork({ chainId: targetChainId })
  }
}
