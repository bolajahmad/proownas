import { CenterBody } from '@components/layout/CenterBody'
import { ProposalById } from '@components/proposals/ProposalById'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
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

  const router = useRouter()
  const { id } = router.query

  return (
    <>
      <CenterBody tw="mb-10 px-5">
        <div tw="mt-20 flex w-full items-center rounded-md bg-gray-900 px-16 py-6">
          <h2 tw="font-bold text-3xl">Proposal {id}</h2>
        </div>

        <div>
          <ProposalById id={id as string} />
        </div>
      </CenterBody>
    </>
  )
}

export default HomePage
