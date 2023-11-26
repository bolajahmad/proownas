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
        address: 'bX2fjXSZdnGv1fQZJHvtXp2S7dguc48nkkzQBsqFVicPuMZ',
      },
      {
        contractId: ContractIds.PropertyToken,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/propertytoken/metadata.json`),
        address: 'ZtS3UKnZysVQSPMpaqkWVyxSVtm1VQCzfbGTKajeuu5oPXU',
      },
      {
        contractId: ContractIds.Multisig,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/multisig/metadata.json`),
        address: 'W4pcaPxKZguTSQxkQsmCu7Udun4LUr3JtBdic7SmnaU7Zbh',
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
