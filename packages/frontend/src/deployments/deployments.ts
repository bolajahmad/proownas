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
        address: 'XP2aEpgQPddzQV6zokhbJwp9vTVjNjQsHiojpF4hAYtsegL',
      },
      {
        contractId: ContractIds.PropertyToken,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/propertytoken/metadata.json`),
        address: 'YCLULSSLCDHy9rjcaHVzfMNoprxw7qVrKNudXymvBNEZFuC',
      },
      {
        contractId: ContractIds.Multisig,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/multisig/metadata.json`),
        address: 'auvCG6zefsnC8hKpTQ1F69EUAL38qxKm8XszH5M6DctksUc',
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
