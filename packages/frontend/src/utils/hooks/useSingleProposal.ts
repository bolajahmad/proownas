import { makeWeb3StorageClient } from '@config/getSupportedChains'
import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { Proposal } from '../../types/customs'
import { use, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useProownasDAOContext } from '@context/ProownasDAO'

export async function fetchMetadataByCID(cid: string) {
  try {
    const client = makeWeb3StorageClient()
    const response = await client.get(cid)
    if (!response?.ok) {
      throw new Error(`failed to get ${cid}`)
    }

    return await response.files()
  } catch (error) {
    console.error(error)
    return null
  }
}

export const useFetchProposal = (proposalId: string | number, proposalCid?: string) => {
  const [proposalMetadata, setMetadata] = useState<Record<string, any>>()
  const [proposalFiles, setFiles] = useState<any[]>([])
  const [isLoading, setLoading] = useState(false)

  const fetchProposalIPFSData = useCallback(
    async (proposalCid?: string) => {
      setLoading(true)
      try {
        if (proposalCid) {
          const proposalFiles = await fetchMetadataByCID(proposalCid)
          if (proposalFiles) {
            const reader = new FileReader()
            reader.onload = (event) => {
              if (event.target) {
                try {
                  const jsonData = JSON.parse(event.target.result as string)
                  setMetadata({
                    description: jsonData.description,
                    filesCID: jsonData.filesCID,
                    references: jsonData.references ? jsonData.references : undefined,
                  })
                } catch (error) {
                  console.error(error)
                }
              }
            }
            reader.readAsText(proposalFiles[0])
          }
        }
      } catch (e) {
        console.error(e)
        toast.error('Error while fetching proposal count. Try again…')
        return null
      } finally {
        setLoading(false)
      }
    },
    [proposalCid],
  )

  const fetchProposalFiles = useCallback(async () => {
    if (proposalMetadata) {
      const { filesCID } = proposalMetadata as any
      console.log({ filesCID })

      const metadataFiles = await fetchMetadataByCID(filesCID)
      if (metadataFiles && metadataFiles.length > 0) {
        const updatedFiles = metadataFiles.map((file) => {
          return {
            name: file.name,
            size: file.size,
            href: URL.createObjectURL(file),
            cid: file.cid,
          }
        })
        setFiles(updatedFiles)
      }
    }
  }, [proposalMetadata])

  useEffect(() => {
    fetchProposalFiles()
  }, [fetchProposalFiles])

  useEffect(() => {
    fetchProposalIPFSData(proposalCid as string)
  }, [proposalCid])

  return {
    proposalMetadata,
    fetchProposalIPFSData,
    proposalFiles,
    isLoading,
  }
}
