#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dao {
    use ink::prelude::vec::Vec;
    use ink::storage::traits::StorageLayout;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        InvalidAsset,
        AsserExists,
    }

    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub enum ProposalStatus {
        Pending,
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
        derive(Debug, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub struct Proposal {
        status: ProposalStatus,
        start_block: u32,
        duration: u32,
        proposal_cid: Vec<u8>,
    }

    #[ink(storage)]
    #[derive(Default)]
    pub struct DAO {
        proposals_list: Vec<Proposal>,
        proposals_by_account: Mapping<AccountId, Vec<u64>>,
        proposal_count: u64,
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
                proposals_list: Vec::new(),
                proposals_by_account: Mapping::new(),
                proposal_count: 0,
                assets_owned,
            }
        }

        /// Submit a new proposal to the DAO
        /// @param proposal_cid: IPFS CID of the proposal.
        #[ink(message)]
        pub fn submit_new_proposal(&mut self, proposal_cid: Vec<u8>) -> Result<()> {
            let caller = self.env().caller();
            let mut proposals_of = self.proposals_by_account.get(&caller).unwrap_or(Vec::new());

            let proposal_exists = self
                .proposals_list
                .iter()
                .any(|p| p.proposal_cid == proposal_cid);

            // proposal_cid must be existent, need to update the proposal in that case.
            assert!(!proposal_exists, "Proposal exists");

            let mut proposal_count = self.proposal_count;
            proposal_count += 1;
            proposals_of.push(proposal_count);
            self.proposals_by_account
                .insert(&caller, &proposals_of.clone());

            let proposal = Proposal {
                status: ProposalStatus::Pending,
                duration: 10,
                start_block: self.env().block_number(),
                proposal_cid,
            };
            self.proposals_list.push(proposal);

            self.proposal_count = proposal_count;
            Ok(())
        }
    }

    // #[cfg(test)]
    // mod tests {
    //     use super::*;

    // }
}
