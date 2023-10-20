export enum ProposalStatus {
  Pending = 'Pending',
  Ongoing = 'Ongoing',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface Proposal {
  status: ProposalStatus
  startBlock: number
  timestamp: number
  proposer: string
  duration: number
  proposalCid: string
  proposalId: number
}
