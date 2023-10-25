import { Badge, Skeleton, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { Proposal, ProposalStatus } from '../../types/customs'
import { fetchMetadataByCID, useFetchProposal } from '@utils/hooks/useSingleProposal'
import Link from 'next/link'
import 'twin.macro'
import { useProownasDAOContext } from '@context/ProownasDAO'
import { useCallback, useEffect, useState } from 'react'
import { ProposalVotingActionsView } from './ProposalVotingActionsView'
import { truncateHash } from '@utils/truncateHash'
import { useDAOProposal } from '@utils/hooks/useDAOProposal'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { ContractIds } from '@deployments/deployments'
import toast from 'react-hot-toast'

export const ProposalById = ({ id }: { id: string }) => {
  const { selectedProposal } = useProownasDAOContext()!
  const [isLoading, setLoading] = useState(false)
  const [proposalMetadata, setMetadata] = useState<Record<string, any>>()
  const { proposalFiles } = useFetchProposal(id, selectedProposal?.proposalCid)

  const fetchProposalIPFSData = useCallback(async (proposalCid?: string) => {
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
  }, [])

  useEffect(() => {
    fetchProposalIPFSData(selectedProposal?.proposalCid)
  }, [selectedProposal])

  console.log({ selectedProposal, proposalMetadata, proposalFiles })

  return (
    <div tw="grid grid-cols-1 gap-10 md:grid-cols-2">
      <section tw="rounded-md bg-gray-900 p-3">
        <h2 tw="font-bold text-2xl">Proposal of {truncateHash(selectedProposal?.proposer, 5)}</h2>
        <p tw="mt-6">{proposalMetadata?.description}</p>

        <div tw="mt-12">
          <h2 tw="font-bold text-xl">Linked References</h2>
          <ol tw="mt-6 flex flex-col gap-2">
            {proposalMetadata?.references && proposalMetadata.references.length ? (
              proposalMetadata.references.map(({ desc, href, id }: any) => (
                <li key={id} tw="w-full p-2 odd:bg-slate-800">
                  <Link
                    href={href}
                    target="_blank"
                    tw="w-full cursor-pointer text-blue-500 underline"
                  >
                    <span>
                      <strong>{desc}</strong>
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <div tw="text-red-600">No references provided</div>
            )}
          </ol>
        </div>

        <div tw="mt-12">
          <ul tw="flex w-full flex-col gap-2 text-lg"></ul>
        </div>
      </section>

      <section tw="rounded-md bg-gray-900 p-3">
        <h2 tw="flex items-start justify-between">
          <span tw="font-bold text-3xl">Activities</span>

          <Badge variant="solid" tw="mt-3 ml-6 rounded-lg py-1 px-3">
            {selectedProposal?.status}
          </Badge>
        </h2>

        <div tw="mt-12">
          <ul tw="flex w-full flex-col gap-2 text-lg">
            <li>
              <strong tw="text-gray-200">Proposed by:</strong>{' '}
              <span>{truncateHash(selectedProposal?.proposer, 6)}</span>
            </li>
            <li>
              <strong tw="text-gray-200">Start block:</strong>{' '}
              <span>{selectedProposal?.startBlock}</span>
            </li>
            <li>
              <strong tw="text-gray-200">Vote duration:</strong>{' '}
              <span>{selectedProposal?.duration} blocks</span>
            </li>
            <li>
              <strong tw="text-gray-200">Voting active:</strong>{' '}
              <span tw="uppercase">
                {selectedProposal?.status == ProposalStatus.Ongoing ? 'true' : 'false'}
              </span>
            </li>
          </ul>
        </div>

        {selectedProposal ? <ProposalVotingActionsView proposal={selectedProposal} /> : null}
      </section>

      <section tw="rounded-md bg-gray-900 p-3 md:col-span-2">
        <h2 tw="">
          <span tw="font-bold text-3xl">Related Files</span>
        </h2>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th isNumeric>S/N</Th>
                <Th>Name</Th>
                <Th>Content Identifier</Th>
                <Th isNumeric>Size</Th>
              </Tr>
            </Thead>
            <Tbody>
              {proposalFiles.map((file: any, index: number) => (
                <Tr key={file.cid + file.name}>
                  <Td>{index + 1}</Td>
                  <Td>
                    <Link href={`https://${file.cid}.ipfs.dweb.link/`}>
                      <span tw="">{file.name}</span>
                    </Link>
                  </Td>
                  <Td>
                    <Link target="blank" href={`https://${file.cid}.ipfs.dweb.link/`}>
                      <span tw="">{truncateHash(file.cid, 10)}</span>
                    </Link>
                  </Td>
                  <Td isNumeric>{Math.round(file.size / 1000)}kb</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </section>
    </div>
  )
}
