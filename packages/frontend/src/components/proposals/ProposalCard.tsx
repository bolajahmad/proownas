import { fetchMetadataByCID, useFetchProposal } from '@utils/hooks/useSingleProposal'
import { Proposal } from '../../types/customs'
import { truncateHash } from '@utils/truncateHash'
import { useRouter } from 'next/router'
import tw, { css } from 'twin.macro'
import Link from 'next/link'
import { Skeleton } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useProownasDAOContext } from '@context/ProownasDAO'

const cardCss = css`
  
 ;
`

export const ProposalCard: React.FC<Proposal> = ({ status, ...proposal }) => {
  const router = useRouter()
  const { setSelectedProposal } = useProownasDAOContext()!
  const [isLoading, setLoading] = useState(false)
  const [proposalMetadata, setMetadata] = useState<Record<string, any>>()

  const fetchProposalIPFSData = useCallback(async () => {
    setLoading(true)
    try {
      if (proposal.proposalCid) {
        const proposalFiles = await fetchMetadataByCID(proposal.proposalCid)
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
  }, [proposal.proposalCid])
  useEffect(() => {
    fetchProposalIPFSData()
  }, [])

  const timestamp = Number(proposal.createdAt.split(',').join(''))

  const redirectToProposal = () => {
    router.push(`/proposals/${proposal.proposalId}`)
    setSelectedProposal({ ...proposal, status })
  }

  return (
    <div
      css={cardCss}
      tw="col-span-1 w-full scale-95 rounded-lg border border-pink-100 bg-gray-700 px-6 py-3 shadow-xl transition hover:scale-100"
    >
      <div onClick={() => redirectToProposal()}>
        <div tw="flex items-center justify-between">
          <div tw="flex flex-1 items-center justify-start gap-2 font-medium text-sm">
            <div tw="p-1 font-extrabold text-xl text-blue-700">
              <div tw="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-green-400 p-2">
                <span tw="uppercase">{proposal.proposalCid}</span>
              </div>
            </div>
            <p tw="text-sm">
              Proposal by <strong>{truncateHash(proposal.proposer, 5)}</strong>
            </p>
          </div>

          <span tw="rounded-xl bg-slate-100 px-2 py-1 text-blue-700">{status}</span>
        </div>
        <Skeleton startColor="gray.200" end-color="gray-50" isLoaded={!isLoading}>
          <h2 tw="mt-5 font-bold">{new Date(timestamp).toLocaleDateString()}</h2>
          <p tw="text-slate-100">{proposalMetadata?.description}</p>
        </Skeleton>
      </div>
    </div>
  )
}
