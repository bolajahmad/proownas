import {
  Badge,
  Button,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { ProposalStatus } from '@types/customs'
import { useFetchProposal } from '@utils/hooks/useSingleProposal'
import { useVoteOnProposal } from '@utils/hooks/useVoteOnProposal'
import Link from 'next/link'
import 'twin.macro'

export const ProposalById = ({ id }: { id: string }) => {
  const { rawProposal, proposalMetadata, proposalFiles } = useFetchProposal(id)
  const { activateVoting } = useVoteOnProposal()
  console.log({ rawProposal, proposalMetadata, proposalFiles })

  return (
    <div tw="grid grid-cols-1 gap-10 md:grid-cols-2">
      <section tw="rounded-md bg-gray-900 p-3">
        <h2 tw="font-bold text-3xl">Proposal of {rawProposal?.proposer ?? '#'}</h2>
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
            {rawProposal?.status}
          </Badge>
        </h2>

        <div tw="mt-12">
          <ul tw="flex w-full flex-col gap-2 text-lg">
            <li>
              <strong tw="text-gray-200">Proposed by:</strong> <span>{rawProposal?.proposer}</span>
            </li>
            <li>
              <strong tw="text-gray-200">Start block:</strong>{' '}
              <span>{rawProposal?.startBlock}</span>
            </li>
            <li>
              <strong tw="text-gray-200">Vote duration:</strong>{' '}
              <span>{rawProposal?.duration} blocks</span>
            </li>
            <li>
              <strong tw="text-gray-200">Voting active:</strong>{' '}
              <span tw="uppercase">
                {rawProposal?.status == ProposalStatus.Ongoing ? 'true' : 'false'}
              </span>
            </li>
          </ul>
        </div>

        {rawProposal?.status == ProposalStatus.Pending && (
          <div tw="mt-8 ml-auto w-fit">
            <Button tw="bg-blue-500 hover:bg-blue-700" onClick={() => activateVoting(Number(id))}>
              Activate Voting
            </Button>
          </div>
        )}
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
                      <span tw="">{file.cid}</span>
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
