import { env } from './environment'
import { Web3Storage } from 'web3.storage'

/**
 * Returns the supported chains from the environment variables.
 * If the environment variable is not set, it returns the default chain.
 */
export const getSupportedChains = (): string[] => {
  const defaultChain = process.env.NEXT_PUBLIC_DEFAULT_CHAIN
  const parsedChains =
    !!process.env.NEXT_PUBLIC_SUPPORTED_CHAINS &&
    JSON.parse(process.env.NEXT_PUBLIC_SUPPORTED_CHAINS)
  return parsedChains || [defaultChain]
}

export function makeWeb3StorageClient() {
  return new Web3Storage({ token: env.web3Storage })
}
