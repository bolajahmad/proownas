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
        address: 'bQ7VDasSoTRGGtYN4RD7Z66QosXVusS4CG5vyD1vH4PQnfy',
      },
      {
        contractId: ContractIds.PropertyToken,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/propertytoken/metadata.json`),
        address: 'ZhnTPEn5BuMa8u7sgGnwLHBVeWtibrZmSGLE64HtbNtMNDs',
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
