import { fetchMetadataByCID, useFetchProposal } from '@utils/hooks/useSingleProposal'
import { Proposal } from '../../types/customs'
import { truncateHash } from '@utils/truncateHash'
import { useRouter } from 'next/router'
import tw, { css } from 'twin.macro'
import Link from 'next/link'
import { Button, Skeleton } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useProownasDAOContext } from '@context/ProownasDAO'
import { Property } from './PropertiesView'

export const PropertyCard: React.FC<Property> = ({ owner, tokenCID }) => {
  const [isCopied, setCopied] = useState<string | boolean>(false)
  const [isLoading, setLoading] = useState(false)
  const [propertyMetadata, setMetadata] = useState<Record<string, any>>()
  const { proposalFiles } = useFetchProposal('', tokenCID)

  const fetchProposalIPFSData = useCallback(async () => {
    setLoading(true)
    try {
      if (tokenCID) {
        const files = await fetchMetadataByCID(tokenCID)
        if (files) {
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
          reader.readAsText(files[0])
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    } finally {
      setLoading(false)
    }
  }, [tokenCID])
  useEffect(() => {
    fetchProposalIPFSData()
  }, [])

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  console.log({ propertyMetadata, proposalFiles })
  return (
    <div tw="col-span-1 w-full scale-95 rounded-lg border border-pink-100 bg-gray-700 px-6 py-3 shadow-xl transition hover:scale-100">
      <div>
        <div tw="flex items-center justify-between">
          <div tw="flex flex-1 items-center justify-start gap-2 font-medium text-sm">
            <div tw="p-1 font-extrabold text-xl text-blue-700">
              <div tw="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-green-400 p-2">
                <span tw="uppercase">{tokenCID}</span>
              </div>
            </div>
            <p tw="text-sm">
              Owned by <strong>{truncateHash(owner, 5)}</strong>
            </p>
          </div>

          <Button variant="ghost" onClick={() => copyText(tokenCID)}>
            Copy Hash
          </Button>
        </div>
        <Skeleton startColor="gray.200" end-color="gray-50" tw="mt-4" isLoaded={!isLoading}>
          <p tw="text-slate-100">{propertyMetadata?.description}</p>
        </Skeleton>

        <ul tw="mt-4">
          {proposalFiles.map((file: any) => (
            <li key={file.cid + file.name} tw="flex items-center justify-start gap-3">
              <div>
                <span tw="">{truncateHash(file.name, 5, 4)}</span>
              </div>
              <Link
                href={`https://${file.cid}.ipfs.dweb.link/`}
                target="_blank"
                tw="px-2 font-bold text-blue-300"
              >
                <span tw="">View on IPFS</span>
              </Link>
              <Button variant="ghost" onClick={() => copyText(file.cid)}>
                Copy Hash
              </Button>
              <div tw="ml-auto">{Math.round(file.size / 1000)}kb</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
