import { ConnectButton } from '@components/web3/ConnectButton'
import { FC } from 'react'
import 'twin.macro'

export const Navbar: FC = () => {
  return (
    <>
      <div tw="sticky top-0 left-0 right-0 z-10 px-6 py-2">
        <div tw="ml-auto w-fit">
          <ConnectButton />
        </div>
      </div>
    </>
  )
}
