import { env } from '@config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'

export enum ContractIds {
  Dao = 'dao',
  PropertyToken = 'propertytoken',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments = networks
    .map(async (network) => [
      {
        contractId: ContractIds.Dao,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/dao/metadata.json`),
        address: 'WLxcTuqKGyCd5fEKWYQcBTDYUYfPQfHyGPwgpPmgBh5Fp92',
      },
      {
        contractId: ContractIds.PropertyToken,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/propertytoken/metadata.json`),
        address: 'YAEtNFRedZUHHKJQj9Qp5Qu88E9hGugGXUtKPTcYdKwAweL',
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
