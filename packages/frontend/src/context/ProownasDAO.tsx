import { useDAOProposal } from '@utils/hooks/useDAOProposal'
import { PropsWithChildren, createContext, useContext } from 'react'

interface State {
  count: number
  proposals: any[]
}

export const ProownasDAOContext = createContext<State | null>(null)

export function ProownasDaoProvider({ children }: PropsWithChildren) {
  const { proposalCount, proposals } = useDAOProposal()
  return (
    <ProownasDAOContext.Provider
      value={{
        count: proposalCount,
        proposals,
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
