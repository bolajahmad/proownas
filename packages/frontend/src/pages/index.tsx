import { DAOStatsView } from '@components/home/DisplayDAOStats'
import { HomePageTitle } from '@components/home/HomePageTitle'
import { CenterBody } from '@components/layout/CenterBody'
import { ChainInfo } from '@components/web3/ChainInfo'
import { GreeterContractInteractions } from '@components/web3/GreeterContractInteractions'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
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
      <CenterBody tw="mt-10 mb-10 px-5">
        <HomePageTitle />

        <div tw="w-full">
          <DAOStatsView />
        </div>

        <div tw="mt-10 flex w-full flex-wrap items-start justify-start gap-4">
          <ChainInfo />
          <ChainInfo />
        </div>
      </CenterBody>
    </>
  )
}

export default HomePage
