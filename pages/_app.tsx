import "@/styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import type { AppProps } from "next/app"
import { Inter as FontSans } from "@next/font/google"
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit"
import { ThemeProvider } from "next-themes"
import { WagmiConfig, configureChains, createClient } from "wagmi"
import { arbitrumGoerli, goerli } from "wagmi/chains"
import { alchemyProvider } from "wagmi/providers/alchemy"
import { publicProvider } from "wagmi/providers/public"

import { Toaster } from "@/components/ui/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const alchemyApiKey = process.env.ALCHEMY_API_KEY

const { chains, provider } = configureChains(
  [arbitrumGoerli, goerli],
  [alchemyProvider({ apiKey: alchemyApiKey }), publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: "zkprover-dapp",
  chains,
})

const wagmiClient = createClient({
  autoConnect: false,
  connectors,
  provider,
})

// For fixed this bug: https://github.com/wagmi-dev/wagmi/issues/542
wagmiClient.autoConnect()

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
            <Toaster />
          </RainbowKitProvider>
        </WagmiConfig>
      </ThemeProvider>
    </>
  )
}
