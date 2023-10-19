import { useRouter } from 'next/router'

export const ProposalCard: React.FC<any> = ({ status, ...proposal }) => {
  const router = useRouter()
  return (
    <div className="border-neutral card col-span-1 w-full scale-95 rounded-lg bg-secondary shadow-xl transition hover:scale-100">
      <div
        className="card-body cursor-pointer"
        onClick={() => router.push(`/lens-voting/${proposal.id}`)}
      >
        <div className="card-actions justify-between">
          <div className="flex flex-1 items-center justify-start gap-2 text-sm font-medium">
            <div className="placeholder avatar">
              <div className="w-8 rounded-full bg-success text-neutral-content">
                <span className="text-xs uppercase">{proposal.proposalCid}</span>
              </div>
            </div>
            <p className="text-md">
              Proposal# by <strong>address</strong>
            </p>
          </div>

          <span className="badge badge-md rounded-xl bg-secondary text-primary">{status}</span>
        </div>
        <h2 className="card-title mt-5 text-primary">2 days ago</h2>
        <p>New proposal</p>
      </div>
    </div>
  )
}
