import { HomePageTitle } from '@components/home/HomePageTitle'
import { CenterBody } from '@components/layout/CenterBody'
import { ChainInfo } from '@components/web3/ChainInfo'
import { GreeterContractInteractions } from '@components/web3/GreeterContractInteractions'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

// export const getStaticProps = (async (context) => {
//   const res = await fetch('https://api.github.com/repos/vercel/next.js')
//   const repo = await res.json()
//   return { props: { repo } }
// }) satisfies GetStaticProps<{
//   repo: Repo
// }>

const HomePage: NextPage = () => {
  // Display `useInkathon` error messages (optional)
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <CenterBody tw="mt-20 mb-10 px-5">
        {/* Title */}
        <HomePageTitle />

        <div tw="mt-10 flex w-full flex-wrap items-start justify-center gap-4">
          {/* Chain Metadata Information */}
          <ChainInfo />

          {/* Greeter Read/Write Contract Interactions */}
          <GreeterContractInteractions />
        </div>
      </CenterBody>
    </>
  )
}

export default HomePage
