import { Card, Spinner } from '@chakra-ui/react'
import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import 'twin.macro'

export const DAOStatsView = () => {
  const [assetCount, setAssetCount] = useState(0)
  const [proposalCount, setCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const { api, activeChain } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)
  const { contract: pspContract } = useRegisteredContract(ContractIds.PropertyToken)

  const fetchProposalStats = async () => {
    if (!contract || !api) return null

    setLoading(true)
    try {
      {
        const result = await contractQuery(api, '', contract, 'get_proposal_count')
        const { output, isError, decodedOutput } = decodeOutput(
          result,
          contract,
          'get_proposal_count',
        )
        if (isError) throw new Error(decodedOutput)

        setCount(output.split(',').join(''))
      }

      {
        const result = await contractQuery(api, '', contract, 'get_all_users')
        const { output, isError, decodedOutput } = decodeOutput(result, contract, 'get_all_users')
        if (isError) throw new Error(decodedOutput)

        setUserCount(output['1'])
      }
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchMintedAssets = async () => {
    if (!contract || !api) return null
    try {
      const result = await contractQuery(api, '', pspContract!, 'PSP34::total_supply')
      const { output, isError, decodedOutput } = decodeOutput(
        result,
        pspContract!,
        'PSP34::total_supply',
      )
      if (isError) throw new Error(decodedOutput)
      setAssetCount(Number(output.split(',').join('')))
    } catch (error) {
      console.error(error)
      toast.error('Error while fetching minted count. Try again…')
      return null
    }
  }

  useEffect(() => {
    fetchMintedAssets()
  }, [pspContract, api])

  useEffect(() => {
    fetchProposalStats()
  }, [contract, api])

  if (!api)
    return (
      <div tw="mt-8 mb-4 flex flex-col items-center justify-center space-y-3 text-center font-mono text-sm text-gray-400 sm:(flex-row space-x-3 space-y-0)">
        <Spinner size="sm" />
        <div>Loading DAO Stats</div>
      </div>
    )

  return (
    <>
      <div tw="flex max-w-full grow flex-col space-y-4">
        <h2 tw="text-center font-mono text-gray-400">Chain Info</h2>

        <Card variant="outline" p={4} bgColor="whiteAlpha.100">
          {/* Metadata */}
          {isLoading ? (
            <div tw="mx-auto text-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div tw="grid grid-cols-2 md:grid-cols-3">
              <div tw="flex flex-col items-center gap-3 text-sm leading-7">
                <span>Total Member(s)</span>
                <strong tw="float-right ml-6 truncate max-w-[15rem]">{userCount}</strong>
              </div>

              <div tw="flex flex-col items-center gap-3 text-sm leading-7">
                <span>Total Proposal(s)</span>
                <strong tw="float-right ml-6 truncate max-w-[15rem]">{proposalCount}</strong>
              </div>

              <div tw="flex flex-col items-center gap-3 text-sm leading-7">
                <span>Total Asset(s)</span>
                <strong tw="float-right ml-6 truncate max-w-[15rem]">{assetCount}</strong>
              </div>
            </div>
          )}
          {/* {Object.entries(chainInfo || {}).map(([key, value]) => (
            <div key={key} tw="text-sm leading-7">
              {key}:
              <strong tw="float-right ml-6 truncate max-w-[15rem]" title={value}>
                {value}
              </strong>
            </div>
          ))} */}

          <div tw="mt-3 flex items-center justify-center space-x-3">
            {/* Explorer Link */}
            {!!activeChain?.explorerUrls && !!Object.keys(activeChain.explorerUrls)?.length && (
              <Link
                href={Object.values(activeChain.explorerUrls)[0]}
                target="_blank"
                tw="flex items-center justify-center gap-1 text-center text-sm text-gray-400 hover:text-white"
              >
                {/* Explorer <HiOutlineExternalLink /> */}
              </Link>
            )}
            {/* Faucet Link */}
            {/* {!!activeChain?.faucetUrls?.length && (
              <Link
                href={activeChain.faucetUrls[0]}
                target="_blank"
                tw="flex items-center justify-center gap-1 text-center text-sm text-gray-400 hover:text-white"
              >
                Faucet <HiOutlineExternalLink />
              </Link>
            )} */}
            {/* Contracts UI Link */}
            {/* {!!activeChain?.rpcUrls?.length && (
              <Link
                href={`https://contracts-ui.substrate.io/?rpc=${activeChain.rpcUrls[0]}`}
                target="_blank"
                tw="flex items-center justify-center gap-1 text-center text-sm text-gray-400 hover:text-white"
              >
                Contracts UI <HiOutlineExternalLink />
              </Link>
            )} */}
          </div>
        </Card>

        {/* Mainnet Security Disclaimer */}
        {!activeChain?.testnet && (
          <>
            <h2 tw="text-center font-mono text-red-400">Security Disclaimer</h2>

            <Card variant="outline" p={4} bgColor="red.500" borderColor="red.300" fontSize={'sm'}>
              You are interacting with un-audited mainnet contracts and risk all your funds. Never
              transfer tokens to this contract.
            </Card>
          </>
        )}
      </div>
    </>
  )
}
