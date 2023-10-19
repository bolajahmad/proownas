import { useRouter } from 'next/router'
import tw, { css } from 'twin.macro'

const cardCss = css`
  
 ;
`

export const ProposalCard: React.FC<any> = ({ status, ...proposal }) => {
  const router = useRouter()
  return (
    <div
      css={cardCss}
      tw="col-span-1 w-full scale-95 rounded-lg border border-pink-100 bg-gray-700 px-6 py-3 shadow-xl transition hover:scale-100"
    >
      <div onClick={() => router.push(`/proposals/${proposal.id}`)}>
        <div tw="flex items-center justify-between">
          <div tw="flex flex-1 items-center justify-start gap-2 font-medium text-sm">
            <div tw="p-1 font-extrabold text-xl text-blue-700">
              <div tw="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-green-400 p-2">
                <span tw="uppercase">{proposal.proposalCid}</span>
              </div>
            </div>
            <p tw="text-lg">
              Proposal# by <strong>address</strong>
            </p>
          </div>

          <span tw="rounded-xl bg-slate-100 px-2 py-1 text-blue-700">{status}</span>
        </div>
        <h2 tw="mt-5 font-bold">2 days ago</h2>
        <p tw="text-slate-100">New proposal</p>
      </div>
    </div>
  )
}
