import { Proposal } from '../types/customs'
import { useDAOProposal } from '@utils/hooks/useDAOProposal'
import { PropsWithChildren, createContext, useContext, useState } from 'react'

interface State {
  count: number
  proposals: any[]
  fetchProposalById: (id: number) => Promise<Proposal | null>
  selectedProposal?: Proposal
}

export const ProownasDAOContext = createContext<State | null>(null)

export function ProownasDaoProvider({ children }: PropsWithChildren) {
  const { proposalCount, proposals, fetchProposalById, selectedProposal } = useDAOProposal()

  return (
    <ProownasDAOContext.Provider
      value={{
        count: proposalCount,
        proposals,
        fetchProposalById,
        selectedProposal,
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
