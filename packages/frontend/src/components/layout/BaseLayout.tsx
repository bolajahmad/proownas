import { FC, PropsWithChildren } from 'react'
import 'twin.macro'
import { Sidebar } from './Sidebar'
import { Navbar } from '@components/home/Navbar'

export const BaseLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <div tw="relative flex min-h-full">
        <div tw="flex h-full items-stretch">
          <aside tw="w-full max-w-xs">
            <Sidebar />
          </aside>
          <main tw="relative flex h-full grow flex-col overflow-auto bg-gray-800 pb-14">
            <Navbar />
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
