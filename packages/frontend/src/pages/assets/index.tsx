import { CenterBody } from '@components/layout/CenterBody'
import { PropertiesView } from '@components/properties/PropertiesView'
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
      <CenterBody tw="mb-10 px-5">
        <div tw="mt-20 flex w-full items-center justify-between rounded-md bg-gray-900 px-16 py-6">
          <h2 tw="font-bold text-3xl">All Properties</h2>
        </div>

        <PropertiesView />
      </CenterBody>
    </>
  )
}

export default HomePage
