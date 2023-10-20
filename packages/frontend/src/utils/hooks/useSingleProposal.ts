import { makeWeb3StorageClient } from '@config/getSupportedChains'
import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { Proposal } from '@types/customs'
import { use, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

async function fetchMetadataByCID(cid: string) {
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

export const useFetchProposal = (proposalId: string | number) => {
  const { api } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)
  const [rawProposal, setRawProposal] = useState<Proposal | null>(null)
  const [proposalMetadata, setMetadata] = useState<Record<string, any>>()
  const [proposalFiles, setFiles] = useState<any[]>([])
  const [isLoading, setLoading] = useState(false)

  const fetchProposalById = async (proposalId: string | number) => {
    if (!contract || !api) return null

    setLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'getProposalById', {}, [proposalId])
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'getProposalById')
      if (isError) throw new Error(decodedOutput)

      setRawProposal(output.Ok)

      // fetch metadata from NFT Storage
      const proposalCid = output.Ok.proposalCid

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

      return output.Ok
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchProposalFiles = useCallback(async () => {
    if (proposalMetadata) {
      const { filesCID } = proposalMetadata as any

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
        console.log({ updatedFiles })
        setFiles(updatedFiles)
      }
    }
  }, [proposalMetadata])

  useEffect(() => {
    fetchProposalFiles()
  }, [fetchProposalFiles])

  useEffect(() => {
    fetchProposalById(proposalId)
  }, [])

  return {
    rawProposal,
    proposalMetadata,
    proposalFiles,
  }
}
