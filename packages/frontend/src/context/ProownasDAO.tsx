import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { Proposal } from '../types/customs'
import { useDAOProposal } from '@utils/hooks/useDAOProposal'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ContractIds } from '@deployments/deployments'

interface State {
  count: number
  proposals: any[]
  fetchProposalById: (id: number) => Promise<Proposal | null>
  selectedProposal?: Proposal
  setSelectedProposal: (proposal?: Proposal) => void
}

export const ProownasDAOContext = createContext<State | null>(null)

export function ProownasDaoProvider({ children }: PropsWithChildren) {
  const [selectedProposal, setProposal] = useState<Proposal>()
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
      setProposal(output.Ok)
      return output.Ok
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    } finally {
      setFetchingProposal(false)
    }
  }

  const setSelectedProposal = (proposal?: Proposal) => {
    setProposal(proposal)
  }

  useEffect(() => {
    fetchProposals()
  }, [contract])

  return (
    <ProownasDAOContext.Provider
      value={{
        count: proposalCount,
        proposals,
        fetchProposalById,
        selectedProposal,
        setSelectedProposal,
      }}
    >
      {children}
    </ProownasDAOContext.Provider>
  )
}

export const useProownasDAOContext = () => {
  const context = useContext(ProownasDAOContext)

  if (context === undefined) {
    throw new Error('useMaginkContract must be used within a MaginkContractProvider')
  }

  return context
}
