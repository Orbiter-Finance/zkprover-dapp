import "@/styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"

import { Inter as FontSans } from "@next/font/google"
import { ThemeProvider } from "next-themes"
import type { AppProps } from "next/app"

import {
  getDefaultWallets, RainbowKitProvider
} from "@rainbow-me/rainbowkit"
import { configureChains, createClient, WagmiConfig } from "wagmi"
import { arbitrumGoerli, goerli } from "wagmi/chains"
import { alchemyProvider } from "wagmi/providers/alchemy"
import { publicProvider } from "wagmi/providers/public"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const alchemyApiKey = process.env.ALCHEMY_API_KEY

const { chains, provider } = configureChains(
  [goerli, arbitrumGoerli],
  [alchemyProvider({ apiKey: alchemyApiKey }), publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: "zkprover-dapp",
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
				:root {
					--font-sans: ${fontSans.style.fontFamily};
				}
			}`}</style>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider chains={chains} modalSize="compact">
            <Component {...pageProps} />
          </RainbowKitProvider>
        </WagmiConfig>
      </ThemeProvider>
    </>
  )
}
