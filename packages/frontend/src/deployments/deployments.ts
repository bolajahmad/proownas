import { env } from '@config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'

export enum ContractIds {
  Dao = 'dao',
  PropertyToken = 'propertytoken',
  Multisig = 'multisig',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments = networks
    .map(async (network) => [
      {
        contractId: ContractIds.Dao,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/dao/metadata.json`),
        address: 'WBHemgUgSy3X7N6kVw4mcwFavCHPsTGGtEWzhExayLiUVV2',
      },
      {
        contractId: ContractIds.PropertyToken,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/propertytoken/metadata.json`),
        address: 'bAPfbTiwRaY6tUf8F9UyyM4B19gt4gQgeYmWpVHJiGiDp7b',
      },
      {
        contractId: ContractIds.Multisig,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/multisig/metadata.json`),
        address: 'WX8zrBMqAhSboR2NDJJcPEdJtnkEaEqqQzJYeeoDUDQrmiy',
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
