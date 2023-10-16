#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dao {
    use ink::prelude::vec::Vec;
    use ink::storage::traits::StorageLayout;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    #[ink(event)]
    pub struct ProposalUpdated {
        #[ink(topic)]
        owner: AccountId,
        proposal_cid: Vec<u8>,
        updated_at: u32,
        proposal_id: u128,
    }

    #[ink(event)]
    pub struct VoteUpdated {
        #[ink(topic)]
        voter: AccountId,
        updated_at: u32,
        proposal_id: u128,
        votes_for: Option<u64>,
        votes_against: Option<u64>,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        AlreadyVoted,
        InvalidAsset,
        ProposalNotFound,
        AsserExists,
    }

    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub enum ProposalStatus {
        Pending,
        Ongoing,
        Approved,
        Rejected,
    }

    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub enum VoteType {
        Yes(u64),
        No(u64),
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub struct Proposal {
        status: ProposalStatus,
        start_block: u32,
        duration: u32,
        proposal_cid: Vec<u8>,
        proposal_id: u128,
    }

    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub struct Vote {
        votes_for: Option<u64>,
        votes_against: Option<u64>,
    }
    #[ink(storage)]
    #[derive(Default)]
    pub struct DAO {
        cid_by_proposal_id: Mapping<u128, Vec<u8>>,
        proposal_by_id: Mapping<u128, Proposal>,
        proposals_by_account: Mapping<AccountId, Vec<u128>>,
        proposal_count: u128,
        votes_by_proposal: Mapping<(u128, AccountId), Vote>,
        assets_owned: Mapping<Vec<u8>, AccountId>,
    }

    impl DAO {
        /// Creates a new greeter contract initialized with the given value.
        #[ink(constructor)]
        pub fn new(initial_assets: Vec<u8>) -> Self {
            let mut assets_owned = Mapping::new();
            let caller = Self::env().caller();
            assets_owned.insert(initial_assets, &caller);
            Self {
                cid_by_proposal_id: Mapping::new(),
                proposal_by_id: Mapping::new(),
                proposals_by_account: Mapping::new(),
                proposal_count: 0,
                votes_by_proposal: Mapping::new(),
                assets_owned,
            }
        }

        /// Submit a new proposal to the DAO
        /// anyone can call this function to submit a proposal for asset
        /// @param proposal_cid: IPFS CID of the proposal.
        #[ink(message)]
        pub fn submit_new_asset(&mut self, proposal_cid: Vec<u8>) -> Result<()> {
            let caller: AccountId = self.env().caller();
            let mut proposals_of = self.proposals_by_account.get(&caller).unwrap_or(Vec::new());

            let proposal_exists = match &self.assets_owned.get(&proposal_cid) {
                Some(_) => true,
                None => false,
            };
            // proposal_cid must be existent, need to update the proposal in that case.
            assert!(!proposal_exists, "Proposal exists");
            self.assets_owned.insert(&proposal_cid, &caller);

            let mut proposal_count = self.proposal_count;
            proposal_count += 1;
            proposals_of.push(proposal_count);
            self.proposals_by_account
                .insert(&caller, &proposals_of.clone());

            let proposal = Proposal {
                status: ProposalStatus::Pending,
                duration: 10,
                start_block: self.env().block_number(),
                proposal_cid: proposal_cid.clone(),
                proposal_id: proposal_count,
            };

            self.proposal_count = proposal_count;
            self.cid_by_proposal_id
                .insert(&proposal_count, &proposal_cid);
            self.proposal_by_id.insert(&proposal_count, &proposal);

            self.env().emit_event(ProposalUpdated {
                owner: caller,
                proposal_cid,
                proposal_id: proposal_count,
                updated_at: self.env().block_number(),
            });
            Ok(())
        }

        /// Open proposal for voting
        /// This should be done when the user is verified
        #[ink(message)]
        pub fn activate_voting(&mut self, proposal_id: u128) -> Result<()> {
            let caller = self.env().caller();
            assert!(proposal_id <= self.proposal_count, "Invalid Proposal ID");
            let proposal_option = self.proposal_by_id.get(&proposal_id);

            if let Some(mut proposal) = proposal_option {
                let can_update_proposal = match proposal.status {
                    ProposalStatus::Pending => true,
                    _ => false,
                };
                assert!(can_update_proposal, "Proposal is active",);

                let caller_proposals = match self.proposals_by_account.get(&caller) {
                    Some(ps) => ps,
                    None => Vec::new(),
                };
                assert!(caller_proposals.len() > 0, "No proposals available");

                let current_proposal = caller_proposals.iter().find(|p| **p == proposal_id);

                if current_proposal.is_some() {
                    proposal.status = ProposalStatus::Ongoing;
                    self.proposal_by_id.insert(&proposal_id, &proposal);
                    self.env().emit_event(ProposalUpdated {
                        owner: caller,
                        proposal_cid: proposal.proposal_cid,
                        proposal_id,
                        updated_at: self.env().block_number(),
                    });

                    self.votes_by_proposal.insert(
                        &(proposal_id, caller),
                        &Vote {
                            votes_for: Some(0),
                            votes_against: Some(0),
                        },
                    );
                }

                Ok(())
            } else {
                Err(Error::InvalidAsset)
            }
        }

        #[ink(message)]
        pub fn vote_on_proposal(&mut self, proposal_id: u128, vote: VoteType) -> Result<()> {
            let caller = self.env().caller();
            let block_number = self.env().block_number();
            let proposal = self.proposal_by_id.get(&proposal_id).unwrap();
            assert!(
                proposal.status == ProposalStatus::Ongoing
                    && (proposal.start_block + proposal.duration > block_number),
                "ClosedProposal"
            );

            let to_vote_on = self.votes_by_proposal.get(&(proposal_id, caller)).unwrap();
            let new_votes = match vote {
                VoteType::Yes(_) => {
                    let votes_for = match to_vote_on.votes_for {
                        Some(value) => value + 1,
                        None => 1,
                    };
                    let new_vote = Vote {
                        votes_for: Some(votes_for),
                        votes_against: Some(to_vote_on.votes_against.unwrap()),
                    };
                    new_vote
                }
                VoteType::No(_) => {
                    let votes_against = match to_vote_on.votes_against {
                        Some(value) => value + 1,
                        None => 1,
                    };
                    let new_vote = Vote {
                        votes_for: Some(to_vote_on.votes_for.unwrap()),
                        votes_against: Some(votes_against),
                    };
                    new_vote
                }
            };

            self.votes_by_proposal
                .insert(&(proposal_id, caller), &new_votes);

            self.env().emit_event(VoteUpdated {
                voter: caller,
                proposal_id,
                updated_at: block_number,
                votes_for: new_votes.votes_for,
                votes_against: new_votes.votes_against,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn get_proposal_by_id(&self, proposal_id: u128) -> Result<Proposal> {
            match self.proposal_by_id.get(&proposal_id) {
                Some(proposal) => Ok(proposal),
                None => Err(Error::ProposalNotFound),
            }
        }

        #[ink(message)]
        pub fn get_proposal_ipfs_data(&self, proposal_id: u128) -> Result<Vec<u8>> {
            match self.cid_by_proposal_id.get(&proposal_id) {
                Some(cid) => Ok(cid),
                None => Err(Error::ProposalNotFound),
            }
        }
    }
    // #[cfg(test)]
    // mod tests {
    //     use super::*;

    // }
}
