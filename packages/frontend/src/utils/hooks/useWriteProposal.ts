import { ContractIds } from '@deployments/deployments'
import { useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import { contractTxWithToast } from '@utils/contractTxWithToast'
import { useState } from 'react'
import toast from 'react-hot-toast'

export const useWriteProposal = () => {
  const [isSubmitting, setSubmitting] = useState(false)

  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)

  const createProposal = async (proposalCid: string, duration: number) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    // send submit_new_asset message
    setSubmitting(true)
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'submit_new_proposal', {}, [
        proposalCid,
        new Date().getTime(),
        duration,
      ])
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }
  return {
    createProposal,
    isSubmitting,
  }
}
