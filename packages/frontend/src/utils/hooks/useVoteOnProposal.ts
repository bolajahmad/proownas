import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { contractTxWithToast } from '@utils/contractTxWithToast'

export const useVoteOnProposal = () => {
  const { api, activeAccount } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)

  const activateVoting = async (proposalId: number) => {
    if (!api || !contract || !activeAccount) return
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'activate_voting', {}, [
        proposalId,
      ])
    } catch (error) {
      console.error(error)
    }
  }

  return {
    activateVoting,
  }
}
