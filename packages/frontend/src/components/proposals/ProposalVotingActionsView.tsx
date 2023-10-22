import { Button } from '@chakra-ui/react'
import { useProownasDAOContext } from '@context/ProownasDAO'
import { ProposalStatus, VoteType } from '../../types/customs'
import { Fragment } from 'react'
import { useVoteOnProposal } from '@utils/hooks/useVoteOnProposal'
import 'twin.macro'

export const VoteOnProposal = ({ handleVote }: { handleVote: (type: VoteType) => void }) => {
  return (
    <div tw="mt-12">
      <h3 tw="font-bold text-lg">Vote on Proposal</h3>

      <div>
        <p>Total number of votes</p>
        <ul tw="mt-8 flex flex-col gap-3">
          <li>
            <Button onClick={() => handleVote(VoteType.Yes)}>Yes</Button>
          </li>
          <li>
            <Button onClick={() => handleVote(VoteType.No)}>No</Button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export const ProposalVotingActionsView = ({ id }: { id: string }) => {
  const { selectedProposal } = useProownasDAOContext()!
  const { activateVoting, voteOnProposal, isSubmitting } = useVoteOnProposal()

  return (
    <Fragment>
      {selectedProposal?.status == ProposalStatus.Pending && (
        <div tw="mt-8 ml-auto w-fit">
          <Button tw="bg-blue-500 hover:bg-blue-700" onClick={() => activateVoting(Number(id))}>
            Activate Voting
          </Button>
        </div>
      )}
      {selectedProposal?.status == ProposalStatus.Ongoing && (
        <VoteOnProposal handleVote={(voteType: VoteType) => voteOnProposal(Number(id), voteType)} />
      )}
    </Fragment>
  )
}
