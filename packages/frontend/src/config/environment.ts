import { getSupportedChains } from './supported-chains'

/**
 * Get the URL of the current environment.
 */
const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_URL ?? process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000'
  
    // Include `https://` when not localhost
    url = url.includes('http') ? url : `https://${url}`
  
    // Append trailing `/` if not present
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  
    return url
  }

  
/**
 * Environment Variables defined in `.env.local`.
 * See `env.local.example` for documentation.
 */
export const envConfig = {
  url: getURL(),
  isProduction: process.env.NEXT_PUBLIC_PRODUCTION_MODE === 'true',

  defaultChain: process.env.NEXT_PUBLIC_DEFAULT_CHAIN!,
  supportedChains: getSupportedChains(),

  web3Storage: process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN!,
  nftStorage: process.env.NEXT_PUBLIC_NFTSTORAGE_TOKEN!,
}
