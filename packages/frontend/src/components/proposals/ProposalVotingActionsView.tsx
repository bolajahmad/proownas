import { Button } from '@chakra-ui/react'
import { useProownasDAOContext } from '@context/ProownasDAO'
import { ProposalStatus, VoteType } from '../../types/customs'
import { Fragment, useEffect } from 'react'
import { useVoteOnProposal } from '@utils/hooks/useVoteOnProposal'
import 'twin.macro'

export const VoteOnProposal = ({
  handleVote,
  isLoading,
  yesVotes,
  isFetching,
  noVotes,
}: {
  handleVote: (type: VoteType) => void
  isLoading: boolean
  isFetching?: boolean
  yesVotes: number
  noVotes: number
}) => {
  return (
    <div tw="mt-12">
      <h3 tw="font-bold text-lg">Vote on Proposal</h3>

      <div>
        <p>Total votes: {yesVotes + noVotes}</p>
        <ul tw="mt-8 flex flex-col gap-3">
          <li tw="flex items-center justify-start gap-3">
            <Button
              isLoading={isLoading}
              tw="cursor-pointer rounded-lg bg-green-600 px-10 font-extrabold hover:bg-green-800"
              onClick={() => handleVote(VoteType.Yes)}
            >
              Yes
            </Button>

            <div tw="font-semibold text-blue-400 italic">{yesVotes} vote(s) </div>
          </li>
          <li tw="flex items-center justify-start gap-3">
            <Button
              isLoading={isLoading}
              tw="cursor-pointer rounded-lg bg-red-600 px-10 font-extrabold hover:bg-red-800"
              onClick={() => handleVote(VoteType.No)}
            >
              No
            </Button>
            <div tw="font-semibold text-blue-400 italic">{noVotes} vote(s)</div>
          </li>
        </ul>
      </div>
    </div>
  )
}

export const ProposalVotingActionsView = ({ id }: { id: string }) => {
  const { selectedProposal } = useProownasDAOContext()!
  const { activateVoting, voteOnProposal, isSubmitting, voteStats, fetchVotesStats, isFetching } =
    useVoteOnProposal()
  console.log({ voteStats })
  useEffect(() => {
    fetchVotesStats(Number(id))
  }, [id])

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
        <VoteOnProposal
          noVotes={Number(voteStats?.votesAgainst) || 0}
          yesVotes={Number(voteStats?.votesFor) || 0}
          isFetching={isFetching}
          isLoading={isSubmitting}
          handleVote={(voteType: VoteType) => voteOnProposal(Number(id), voteType)}
        />
      )}
    </Fragment>
  )
}
