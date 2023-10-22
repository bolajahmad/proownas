import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { VoteType } from '../../types/customs'
import { contractTxWithToast } from '@utils/contractTxWithToast'
import { useState } from 'react'

export const useVoteOnProposal = () => {
  const [isSubmitting, setSubmitting] = useState(false)
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

  const voteOnProposal = async (proposalId: number, voteType: VoteType) => {
    setSubmitting(true)
    if (!api || !contract || !activeAccount) return
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'vote_on_proposal', {}, [
        proposalId,
        voteType,
      ])
    } catch (error) {
      console.error(error)
      console.log({ error })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    activateVoting,
    voteOnProposal,
    isSubmitting,
  }
}
