export enum ProposalStatus {
  Pending = 'Pending',
  Ongoing = 'Ongoing',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface Proposal {
  status: ProposalStatus
  startBlock: number
  createdAt: string
  proposer: string
  duration: number
  proposalCid: string
  proposalId: number
}

export enum VoteType {
  Yes = 'Yes',
  No = 'No',
}

export interface Vote {
  voters: string[]
  votesFor?: number
  votesAgainst?: number
}
