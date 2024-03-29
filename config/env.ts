export const envConfig = {
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,

  addressTokenZKB: process.env.NEXT_PUBLIC_ADDRESS_TOKEN_ZKB,
  addressEntryPoint: process.env.NEXT_PUBLIC_ADDRESS_ENTRY_POINT,
  addressAccountFactory: process.env.NEXT_PUBLIC_ADDRESS_ACCOUNT_FACTORY,

  goerliBundlerRpc: process.env.NEXT_PUBLIC_GOERLI_BUNDLER_RPC || 'http:127.0.0.1:4337',
}
