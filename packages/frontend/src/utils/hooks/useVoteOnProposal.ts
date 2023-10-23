import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { Vote, VoteType } from '../../types/customs'
import { contractTxWithToast } from '@utils/contractTxWithToast'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export const useVoteOnProposal = () => {
  const [isSubmitting, setSubmitting] = useState(false)
  const [isFetching, setFetching] = useState(false)
  const [voteStats, setStats] = useState<Vote>()
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

  const fetchVotesStats = async (proposalId: number) => {
    if (!contract || !api) return null

    setFetching(true)
    try {
      const result = await contractQuery(api, '', contract, 'getAllVotesOfProposal', {}, [
        proposalId,
      ])
      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'getAllVotesOfProposal',
      )
      if (isError) throw new Error(decodedOutput)

      console.log({ output })
      setStats(output)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching votes stats. Try again…')
      return null
    } finally {
      setFetching(false)
    }
  }

  return {
    activateVoting,
    voteOnProposal,
    isSubmitting,
    fetchVotesStats,
    isFetching,
    voteStats,
  }
}
