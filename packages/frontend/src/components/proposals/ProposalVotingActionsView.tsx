import { Button, Spinner } from '@chakra-ui/react'
import { useProownasDAOContext } from '@context/ProownasDAO'
import { Proposal, ProposalStatus, Vote, VoteType } from '../../types/customs'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useVoteOnProposal } from '@utils/hooks/useVoteOnProposal'
import 'twin.macro'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { ContractIds } from '@deployments/deployments'
import toast from 'react-hot-toast'
import { contractTxWithToast } from '@utils/contractTxWithToast'

export const VoteOnProposal = ({
  handleVote,
  isLoading,
  proposal,
  deadline,
}: {
  handleVote: (type: VoteType) => void
  isLoading: boolean
  proposal: Proposal
  deadline?: number
}) => {
  const { api, activeAccount } = useInkathon()
  const [isFetching, setFetching] = useState(false)
  const [voteStats, setStats] = useState<Vote>()
  const { contract } = useRegisteredContract(ContractIds.Dao)

  useEffect(() => {
    const fetchVotesStats = async (proposalId: number) => {
      setFetching(true)
      try {
        const result = await contractQuery(api!, '', contract!, 'get_all_votes_of_proposal', {}, [
          proposalId,
        ])
        const { output, isError, decodedOutput } = decodeOutput(
          result,
          contract!,
          'get_all_votes_of_proposal',
        )
        if (isError) throw new Error(decodedOutput)

        setStats(output)
      } catch (e) {
        console.error(e)
        toast.error('Error while fetching votes stats. Try again…')
        return null
      } finally {
        setFetching(false)
      }
    }
    if (!!contract && !!api) {
      fetchVotesStats(proposal.proposalId)
    }
  }, [proposal, contract, api])

  const [yesVotes, noVotes] = useMemo(
    () => [Number(voteStats?.votesFor) || 0, Number(voteStats?.votesAgainst) || 0],
    [voteStats],
  )

  const closeVoting = async (proposalId: number) => {
    if (!api || !contract || !activeAccount) return
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'close_voting_period', {}, [
        proposalId,
      ])
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div tw="mt-12">
      <h3 tw="font-bold text-lg">Vote on Proposal</h3>

      {deadline ? (
        <div>Vote ends in {deadline} blocks</div>
      ) : (
        <div className="flex items-center justify-start gap-4">
          <span>Voting period has passed</span>

          <Button
            tw="cursor-pointer rounded-lg bg-blue-400 px-10 font-extrabold hover:bg-blue-600"
            onClick={() => closeVoting(proposal.proposalId)}
          >
            End Vote
          </Button>
        </div>
      )}

      {isFetching ? (
        <Spinner />
      ) : (
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
      )}
    </div>
  )
}

export const ProposalVotingActionsView = ({ proposal }: { proposal: Proposal }) => {
  const [isSubmitting, setSubmitting] = useState(false)
  const [deadline, setDeadline] = useState<number>()
  const { api, activeAccount } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)

  const activateVoting = async (proposalId: number) => {
    if (!api || !contract || !activeAccount) return
    try {
      setSubmitting(true)
      await contractTxWithToast(api, activeAccount.address, contract, 'activate_voting', {}, [
        proposalId,
      ])
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const voteOnProposal = async (proposalId: number, voteType: VoteType) => {
    setSubmitting(true)
    if (!api || !contract || !activeAccount) return
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'vote_on_proposal', {}, [
        proposalId,
        voteType,
      ])
    } catch (error) {
      console.error(error)
      console.log({ error })
    } finally {
      setSubmitting(false)
    }
  }

  const fetchVoteDeadline = async (proposalId: number) => {
    if (!api || !contract || !activeAccount) return

    setSubmitting(true)
    try {
      const result = await contractQuery(api, '', contract, 'get_voting_period_remaining', {}, [
        proposalId,
      ])
      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'get_voting_period_remaining',
      )
      console.log({ deadlineOutput: output })
      if (isError) throw new Error(decodedOutput)
      setDeadline(Number(output))
    } catch (error) {
      console.error(error)
      console.log({ error })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchVoteDeadline(Number(proposal.proposalId))
  }, [proposal, contract, api])

  return (
    <Fragment>
      {proposal?.status == ProposalStatus.Pending && (
        <div tw="mt-8 ml-auto w-fit">
          <Button
            tw="bg-blue-500 hover:bg-blue-700"
            isLoading={isSubmitting}
            onClick={() => activateVoting(Number(proposal.proposalId))}
          >
            Activate Voting
          </Button>
        </div>
      )}
      {proposal?.status == ProposalStatus.Ongoing && (
        <VoteOnProposal
          isLoading={isSubmitting}
          proposal={proposal}
          deadline={deadline}
          handleVote={(voteType: VoteType) => voteOnProposal(Number(proposal.proposalId), voteType)}
        />
      )}
      <>
        <CloseVoteEvent proposal={proposal} />
      </>
    </Fragment>
  )
}

export const CloseVoteEvent = ({ proposal }: { proposal: Proposal }) => {
  const { api, activeAccount } = useInkathon()
  const [isSubmitting, setSubmitting] = useState(false)
  const { contract } = useRegisteredContract(ContractIds.Dao)

  const mintProperty = async (proposalId: number) => {
    if (!api || !contract || !activeAccount) return
    try {
      setSubmitting(true)
      await contractTxWithToast(api, activeAccount.address, contract, 'create_proposal_asset', {}, [
        proposalId,
      ])
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {proposal.status == ProposalStatus.Approved ? (
        <>
          <div tw="mt-8 flex w-full items-center justify-start gap-4">
            <div>
              Proposal has been <strong tw="font-bold text-green-700">Approved</strong>
            </div>

            <Button
              tw="bg-blue-500 hover:bg-blue-700"
              isLoading={isSubmitting}
              onClick={() => mintProperty(Number(proposal.proposalId))}
            >
              Mint Property
            </Button>
          </div>
        </>
      ) : null}
    </>
  )
}
