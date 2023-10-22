import { Button } from '@chakra-ui/react'
import { HomePageTitle } from '@components/home/HomePageTitle'
import { CenterBody } from '@components/layout/CenterBody'
import { CreateProposalView } from '@components/proposals/CreateProposalView'
import { ProposalView } from '@components/proposals/ProposalView'
import { ChainInfo } from '@components/web3/ChainInfo'
import { GreeterContractInteractions } from '@components/web3/GreeterContractInteractions'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { AiOutlinePlusCircle } from 'react-icons/ai'
import 'twin.macro'

const HomePage: NextPage = () => {
  // Display `useInkathon` error messages (optional)
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <CenterBody tw="mb-10 px-5">
        <div tw="mt-20 flex w-full items-center justify-between rounded-md bg-gray-900 px-16 py-6">
          <h2 tw="font-bold text-3xl">Proposals</h2>

          <div>
            <CreateProposalView />
          </div>
        </div>

        <ProposalView />
      </CenterBody>
    </>
  )
}

export default HomePage
