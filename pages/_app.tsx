import "@/styles/globals.css"
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit"

import "@rainbow-me/rainbowkit/styles.css"
import type { AppProps } from "next/app"
import { Inter as FontSans } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Chain, WagmiConfig, configureChains, createClient } from "wagmi"
import { goerli } from "wagmi/chains"
import { alchemyProvider } from "wagmi/providers/alchemy"
import { publicProvider } from "wagmi/providers/public"

import { envConfig } from "@/config/env"
import { AAInfoProvider } from "@/components/aa-info-provider"
import { Toaster } from "@/components/ui/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const zpGoerliChain: Chain = {
  id: 0x4337,
  name: "zkProver(Goerli)",
  network: "zkProver(Goerli)",
  // iconUrl: '',
  // iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [envConfig.goerliBundlerRpc],
    },
    public: {
      http: [envConfig.goerliBundlerRpc],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Etherscan",
      url: "https://goerli.etherscan.io",
    },
    default: {
      name: "Etherscan",
      url: "https://goerli.etherscan.io",
    },
  },
  testnet: true,
}

const { chains, provider } = configureChains(
  [zpGoerliChain, goerli],
  [alchemyProvider({ apiKey: envConfig.alchemyApiKey }), publicProvider()]
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
            <AAInfoProvider>
              <Component {...pageProps} />
            </AAInfoProvider>
          </RainbowKitProvider>
        </WagmiConfig>
        <Toaster />
      </ThemeProvider>
    </>
  )
}
