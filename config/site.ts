import { NavItem } from "@/types/nav"

interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
    docs: string
  }
}

export const siteConfig: SiteConfig = {
  name: "zkprover-dapp",
  description: "zkProver example dapp.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
  ],
  links: {
    twitter: "https://twitter.com/Orbiter_Finance",
    github: "https://github.com/Orbiter-Finance",
    docs: "https://github.com/Orbiter-Finance",
  },
}
