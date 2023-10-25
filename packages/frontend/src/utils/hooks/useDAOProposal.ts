import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { Proposal } from '../../types/customs'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export const useDAOProposal = () => {
  const [selectedProposal, setSelectedProposal] = useState<Proposal>()
  const [proposalCount, setCount] = useState(0)
  const [proposals, setProposals] = useState<any[]>([])
  const [countLoading, setCountLoading] = useState(false)
  const [fetchingProposal, setFetchingProposal] = useState(false)

  const { api } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)

  // Fetch Proposal Count
  const fetchProposalCount = async () => {
    if (!contract || !api) return null

    setCountLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'getProposalCount')
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'getProposalCount')
      if (isError) throw new Error(decodedOutput)

      setCount(output)
      return output
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    } finally {
      setCountLoading(false)
    }
  }

  const fetchProposals = async () => {
    const proposalCount = await fetchProposalCount()
    if (Number(proposalCount)) {
      const proposals = new Array(proposalCount)
      for (let i = 1; i <= proposalCount; i++) {
        const proposal = await fetchProposalById(i)
        if (proposal) {
          proposals[i - 1] = proposal
        }
      }
      setProposals(proposals)
    }
  }

  const fetchProposalById = async (proposalId: number): Promise<Proposal | null> => {
    if (!contract || !api) return null

    setFetchingProposal(true)
    try {
      const result = await contractQuery(api, '', contract, 'getProposalById', {}, [proposalId])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'getProposalById')
      if (isError) throw new Error(decodedOutput)
      setSelectedProposal(output.Ok)
      return output.Ok
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    } finally {
      setFetchingProposal(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [contract])

  return {
    proposalCount,
    proposals,
    selectedProposal,
    fetchProposalById,
  }
}
