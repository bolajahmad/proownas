#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dao {
    use ink::env::call::{build_call, ExecutionInput, Selector};
    use ink::env::DefaultEnvironment;
    use ink::prelude::vec::Vec;
    use ink::storage::traits::StorageLayout;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    /// Emitted when proposal is created/updated
    #[ink(event)]
    pub struct ProposalUpdated {
        /// The address of the proposal owner
        #[ink(topic)]
        owner: AccountId,
        /// The proposal CID of the proposal
        proposal_cid: Vec<u8>,
        /// The blocknumber where proposal was updated
        updated_at: u32,
        /// The ID of the proposal that was updated
        proposal_id: u128,
    }

    /// Emitted when a vote is casted
    #[ink(event)]
    pub struct VoteUpdated {
        /// Vote address of the new voter
        #[ink(topic)]
        voter: AccountId,
        /// The blocknumber where vote was cast
        updated_at: u32,
        /// The voted decision: VoteType::Yes or VoteType::No
        vote: VoteType,
        /// The ID of the proposal that was voted on
        proposal_id: u128,
        /// The total number of votes for the proposal, after cast
        votes_for: Option<u64>,
        /// The total number of votes against the proposal, after cast
        votes_against: Option<u64>,
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        AlreadyVoted,
        InvalidAsset,
        ProposalNotFound,
        AssetExists,
        TokenMintingFailed,
        TokenBurningFailed,
        VotingHasEnded,
    }

    /// Indicates the current status of a Proposal
    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub enum ProposalStatus {
        /// Proposal is still dormant, this is possible if it has just been submitted
        Pending,
        /// Proposal is being voted on
        /// Need to call the activate_voting function to activate this status
        Ongoing,
        /// Status of a proposal with more Yes than No votes,
        /// and also more that 60% quota
        Approved,
        /// Status of a rejected proposal.
        Rejected,
    }

    /// The specified and allowed vote types
    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub enum VoteType {
        Yes,
        No,
    }

    pub type Result<T> = core::result::Result<T, Error>;
    pub type ContentIdentifier = Vec<u8>;

    /// A proposal can be submitted by anyone
    /// It could be on aything
    ///
    /// 1. To join the DAO
    /// 2. Decide on what to use Assets for
    /// 3. Decide on actions for the DAO
    ///
    /// To submit a proposal, the user must supply valid evidence as PDFs
    /// All related dpcuments must be combined and minted into a single folder on IPFS
    /// This CID is what will be submitted as part of the proposal
    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub struct Proposal {
        /// The current status of a proposal
        status: ProposalStatus,
        /// The start_block of the proposal
        start_block: u32,
        /// How long the voting period should last for
        duration: u32,
        /// The address of the proposar (usually the owner)
        proposer: AccountId,
        /// The UNIX timestamp when proposal was created
        created_at: u64,
        /// The proposal CID obtained as mentioned in the struct description above
        proposal_cid: ContentIdentifier,
        /// The ID of the proposal
        proposal_id: u128,
    }

    /// A struct representing the Vote information
    /// Each proposal must have an associated Vote once the status is ProposalStatus::Ongoing
    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub struct Vote {
        /// The total number of voters on the proposal
        voters: Vec<AccountId>,
        /// ALl votes that are in support of the Proposal
        votes_for: Option<u64>,
        /// All votes that are against the Proposal
        votes_against: Option<u64>,
        /// The block when the vote was started
        start_block: u32,
    }
    #[ink(storage)]
    pub struct DAO {
        /// A quick way to return information about a Proposal
        proposal_by_id: Mapping<u128, Proposal>,
        /// The total number of proposals to the DAO
        /// This is also used to increment the proposal_id of each Proposal
        proposal_count: u128,
        /// A list of all users in the DAO
        /// A user is a member that has had an asset minted
        /// Effectively, a Proposal to join the DAO must be approved
        users: Vec<AccountId>,
        /// Stores a list of all proposal IDs of an account
        proposals_by_account: Mapping<AccountId, Vec<u128>>,
        /// This allows a quick way to know how the vote casting is
        /// For each proposal, there is a Vote struct
        votes_by_proposal: Mapping<u128, Vote>,
        /// The address of the PSP34 contract that is
        /// responsible for minting and burning new assets
        token_contract: AccountId,
        /// A toggle to decide if the contract has default contracts
        /// If false, members cannot mint NFTs and join the DAO
        has_set_default_assets: bool,
    }

    impl DAO {
        /// The constructor of the contract.
        /// supply initial asset to the DAO
        ///
        /// @param token_contract, the address of NFT wizard contract
        /// @return an instantiated DAO contract
        #[ink(constructor)]
        pub fn new(token_contract: AccountId) -> Self {
            Self {
                proposal_by_id: Mapping::new(),
                users: Vec::new(),
                proposals_by_account: Mapping::new(),
                proposal_count: 0,
                votes_by_proposal: Mapping::new(),
                token_contract,
                has_set_default_assets: false,
            }
        }

        /// This is callable by the owner(s) of the DAO (this would ideally be a multisig)
        /// This message does not need to be voted on
        /// It can be used to set assets owned by the DAO owners at the start of Dapp
        ///
        /// @param initial_assets, a list of IPFS CIDs of assets to be minted
        /// This would be minted and owned by the DAO owners
        /// This call would toggle the status of the has_set_default_assets to true
        #[ink(message)]
        pub fn set_default_assets(&mut self, initial_assets: Vec<ContentIdentifier>) -> Result<()> {
            assert!(self.token_contract != AccountId::from([0x0; 32]));
            let mut to_return: Result<()> = Ok(());

            // loop through provided assets and mint each of them
            for asset in initial_assets {
                let result = self.execute_mint_message(self.env().account_id(), asset);
                to_return = match result {
                    true => {
                        self.has_set_default_assets = true;
                        Ok(())
                    }
                    false => Err(Error::TokenMintingFailed),
                };
            }

            to_return
        }

        /* Submit a new proposal to the DAO
         ** anyone can call this function to submit a proposal for asset
         ** @param proposal_cid: IPFS CID of the proposal.
         ** @param created_at: UNIX timestamp when pproposal was created
         ** @param days: duration of the voting period in days
         */
        #[ink(message)]
        pub fn submit_new_proposal(
            &mut self,
            proposal_cid: ContentIdentifier,
            created_at: u64,
            days: u32,
        ) -> Result<()> {
            assert!(self.has_set_default_assets, "Must have set owner's assets");
            self.ensure_valid_cid(&proposal_cid);
            assert!(self.ensure_new_cid(&proposal_cid).is_none());
            let caller = self.env().caller();

            // fetch the proposal count
            let proposal_count = self.proposal_count.checked_add(1).unwrap();
            // fetch the proposals of caller
            let mut proposals_of = self.proposals_by_account.get(&caller).unwrap_or(Vec::new());
            proposals_of.push(proposal_count);

            self.proposals_by_account
                .insert(&caller, &proposals_of.clone());

            // duration in days should be converted to block_number
            // for simplicity and faster testing and feedbacks, this is set to 1day * 500blocks
            let duration = days.checked_mul(500_u32).unwrap();
            let proposal = Proposal {
                status: ProposalStatus::Pending,
                duration,
                start_block: self.env().block_number(),
                proposer: caller,
                created_at,
                proposal_cid: proposal_cid.clone(),
                proposal_id: proposal_count,
            };

            self.proposal_count = proposal_count;
            self.proposal_by_id.insert(&proposal_count, &proposal);
            let is_existing = self.users.iter().any(|a| *a == caller);
            if !is_existing {
                self.users.push(caller);
            };

            self.env().emit_event(ProposalUpdated {
                owner: caller,
                proposal_cid,
                proposal_id: proposal_count,
                updated_at: self.env().block_number(),
            });
            Ok(())
        }

        /// Open proposal for voting
        /// This should be done when the user is part of the DAO
        /// @param proposal_id: ID of the proposal to be activated
        ///
        /// This message will toggle the status of the Proposal to ProposalStatus::Ongoing
        /// This message will initialize the Vote struct for the proposal_id
        #[ink(message)]
        pub fn activate_voting(&mut self, proposal_id: u128) -> Result<()> {
            let caller = self.env().caller();
            assert!(proposal_id <= self.proposal_count, "Invalid Proposal ID");
            let proposal_option = self.proposal_by_id.get(&proposal_id);

            if let Some(mut proposal) = proposal_option {
                self.ensure_pending_proposal(&proposal);

                let caller_proposals = self.ensure_is_member(&caller);
                let current_proposal = caller_proposals.iter().any(|p| *p == proposal_id);

                if current_proposal {
                    proposal.status = ProposalStatus::Ongoing;
                    self.proposal_by_id.insert(&proposal_id, &proposal);
                    self.votes_by_proposal.insert(
                        &proposal_id,
                        &Vote {
                            voters: Vec::new(),
                            votes_for: Some(0),
                            votes_against: Some(0),
                            start_block: self.env().block_number(),
                        },
                    );

                    self.env().emit_event(ProposalUpdated {
                        owner: caller,
                        proposal_cid: proposal.proposal_cid,
                        proposal_id,
                        updated_at: self.env().block_number(),
                    });

                    Ok(())
                } else {
                    Err(Error::InvalidAsset)
                }
            } else {
                Err(Error::InvalidAsset)
            }
        }

        /// message proposal to vote on proposal
        ///
        /// @param proposal_id: ID of the proposal to be voted on
        /// @param vote: VoteType::Yes or VoteType::No
        ///
        /// Any member of the DAO can call this function
        #[ink(message)]
        pub fn vote_on_proposal(&mut self, proposal_id: u128, vote: VoteType) -> Result<()> {
            let caller = self.env().caller();
            let block_number = self.env().block_number();

            // verify that proposal is still ongoing and that vote duration is not up
            let proposal = self.proposal_by_id.get(&proposal_id).unwrap();
            let is_ongoing = match proposal.status {
                ProposalStatus::Ongoing => true,
                _ => false,
            };
            let vote_stats = self.votes_by_proposal.get(&proposal_id).unwrap();
            assert!(
                is_ongoing && (vote_stats.start_block + proposal.duration > block_number),
                "ClosedProposal"
            );

            // ensure that user has not already voted
            let mut existing_vote = self.votes_by_proposal.get(&proposal_id).unwrap();
            let is_existing_user = existing_vote.voters.iter().any(|v| *v == caller);
            assert!(!is_existing_user, "AlreadyVoted");

            existing_vote.voters.push(caller);

            // cast vote
            let new_votes = match vote {
                VoteType::Yes => {
                    let votes_for = match existing_vote.votes_for {
                        Some(value) => value + 1,
                        None => 1,
                    };
                    let new_vote = Vote {
                        voters: existing_vote.voters,
                        votes_for: Some(votes_for),
                        votes_against: Some(existing_vote.votes_against.unwrap()),
                        start_block: existing_vote.start_block,
                    };
                    new_vote
                }
                VoteType::No => {
                    let votes_against = match existing_vote.votes_against {
                        Some(value) => value + 1,
                        None => 1,
                    };
                    let new_vote = Vote {
                        voters: existing_vote.voters,
                        votes_for: Some(existing_vote.votes_for.unwrap()),
                        votes_against: Some(votes_against),
                        start_block: existing_vote.start_block,
                    };
                    new_vote
                }
            };

            self.votes_by_proposal.insert(&proposal_id, &new_votes);
            self.env().emit_event(VoteUpdated {
                voter: caller,
                vote,
                proposal_id,
                updated_at: block_number,
                votes_for: new_votes.votes_for,
                votes_against: new_votes.votes_against,
            });

            Ok(())
        }

        /// message to close voting
        /// Any member of the DAO cann call this
        ///
        /// @param proposal_id: ID of the proposal to be closed
        ///
        /// This message will toggle proposal status to ProposalStatus::Approved or ProposalStatus::Rejected
        /// depending on the result of the vote
        #[ink(message)]
        pub fn close_voting_period(&mut self, proposal_id: u128) -> Result<()> {
            let p = self.get_proposal_by_id(proposal_id);

            match p {
                Ok(mut proposal) => match proposal.status {
                    ProposalStatus::Ongoing => {
                        let vote = self.votes_by_proposal.get(&proposal_id).unwrap();
                        let vote_end_block = vote.start_block + proposal.duration;
                        assert!(
                            vote_end_block < self.env().block_number(),
                            "CannotCloseVoting"
                        );

                        // // calculate vote ratio
                        // // for approval, expect a VoteType::Yes greater than 60%% vote
                        // // for rejection: if total vote < 4
                        let voters_count = vote.voters.len() as u64;
                        let (votes_for, _): (u64, u64) = (
                            match vote.votes_for {
                                Some(value) => value,
                                None => 0,
                            },
                            match vote.votes_against {
                                Some(value) => value,
                                None => 0,
                            },
                        );
                        let percentage = (votes_for.checked_mul(10000))
                            .unwrap()
                            .checked_div(voters_count.checked_mul(100).unwrap())
                            .unwrap();
                        if percentage < 65 || voters_count < 3 {
                            proposal.status = ProposalStatus::Rejected;
                        } else {
                            proposal.status = ProposalStatus::Approved;
                        }
                        self.proposal_by_id.insert(&proposal_id, &proposal);
                        Ok(())
                    }
                    _ => {
                        return Err(Error::VotingHasEnded);
                    }
                },
                _ => {
                    return Err(Error::ProposalNotFound);
                }
            }
        }

        /// message to create proposal asset | mint submitted proposal CID
        /// This message can be called by anyone (in the future, only the multisig can call this)
        /// This expects that proposal is approved already
        ///
        /// @param proposal_id: ID of the proposal to be minted
        /// @param owner: address of the owner of the proposal
        ///
        /// A new token should be minted on successfull call
        /// this should also increase the totalSupply of the NFTs
        #[ink(message)]
        pub fn create_proposal_asset(&mut self, proposal_id: u128, owner: AccountId) -> Result<()> {
            let proposals_owned = self.proposals_by_account.get(&owner).unwrap();
            let proposal_exists = proposals_owned.iter().any(|p| *p == proposal_id);
            let current_proposal = self.proposal_by_id.get(&proposal_id).unwrap();
            assert!(proposal_exists, "Proposal must exist");

            let is_approved_proposal = match &current_proposal.status {
                ProposalStatus::Approved => true,
                _ => false,
            };
            assert!(is_approved_proposal, "Proposal must be approved");

            let result = self.execute_mint_message(owner, current_proposal.proposal_cid);
            match result {
                true => Ok(()),
                false => Err(Error::TokenMintingFailed),
            }
        }

        /// message to destroy proposal asset | burn submitted proposal CID
        #[ink(message)]
        pub fn destroy_asset(&mut self, asset_cid: ContentIdentifier) -> Result<()> {
            let account_id = self.ensure_new_cid(&asset_cid);

            match account_id {
                Some(account) => {
                    let burn_result = build_call::<DefaultEnvironment>()
                        .call(self.token_contract)
                        .gas_limit(0)
                        .exec_input(
                            ExecutionInput::new(Selector::new(ink::selector_bytes!(
                                "burn_property"
                            )))
                            .push_arg(&account)
                            .push_arg(&asset_cid),
                        )
                        .returns::<()>()
                        .try_invoke();

                    match burn_result {
                        Ok(Ok(_)) => Ok(()),
                        _ => Err(Error::TokenBurningFailed),
                    }
                }
                None => Err(Error::TokenBurningFailed),
            }
        }

        #[ink(message)]
        pub fn get_all_votes_of_proposal(&self, proposal_id: u128) -> Vote {
            let votes = self.votes_by_proposal.get(&proposal_id).unwrap();
            votes
        }

        #[ink(message)]
        pub fn verify_proposal_by_id(&self, owner: AccountId, proposal_id: u128) -> bool {
            let proposals_owned = self.proposals_by_account.get(&owner).unwrap();
            let proposal_exists = proposals_owned.iter().any(|p| *p == proposal_id);
            proposal_exists
        }

        #[ink(message)]
        pub fn set_token_contract(&mut self, token_contract: AccountId) {
            self.token_contract = token_contract;
        }

        #[ink(message)]
        pub fn get_token_contract(&self) -> AccountId {
            self.token_contract
        }

        #[ink(message)]
        pub fn get_proposal_by_id(&self, proposal_id: u128) -> Result<Proposal> {
            match self.proposal_by_id.get(&proposal_id) {
                Some(proposal) => Ok(proposal),
                None => Err(Error::ProposalNotFound),
            }
        }

        #[ink(message)]
        pub fn get_proposal_ipfs_data(&self, proposal_id: u128) -> Result<ContentIdentifier> {
            let proposal = self.proposal_by_id.get(&proposal_id);
            match proposal {
                Some(p) => Ok(p.proposal_cid),
                None => Err(Error::ProposalNotFound),
            }
        }

        #[ink(message)]
        pub fn get_proposal_count(&self) -> u128 {
            self.proposal_count
        }

        #[ink(message)]
        pub fn get_voting_period_remaining(&self, proposal_id: u128) -> u32 {
            let blocknumber = self.env().block_number();
            let proposal = self.proposal_by_id.get(&proposal_id).unwrap();
            self.votes_by_proposal.get(&proposal_id).map_or(0, |v| {
                let block_spanned = blocknumber - v.start_block;
                if block_spanned > proposal.duration {
                    0
                } else {
                    proposal.duration - block_spanned
                }
            })
        }

        #[ink(message)]
        pub fn get_all_users(&self) -> (Vec<AccountId>, u32) {
            let all_users = &self.users;
            let length = all_users.len() as u32;
            (all_users.clone(), length)
        }

        pub fn ensure_valid_cid(&self, cid: &ContentIdentifier) {
            assert!(cid.len() >= 5, "Invalid CID")
        }

        /// Called to verify that the proposal_cid submitted is a new proposal
        /// It is sufficient to check the assets_pwned mapping
        /// @param proposal_cid: IPFS CID of the propposal
        pub fn ensure_new_cid(&self, proposal_cid: &ContentIdentifier) -> Option<AccountId> {
            let result = build_call::<DefaultEnvironment>()
                .call(self.token_contract)
                .gas_limit(0)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("psp34::owner_of")))
                        .push_arg(&proposal_cid),
                )
                .returns::<AccountId>()
                .try_invoke();

            match result {
                Ok(Ok(account)) => Some(account),
                _ => None,
            }
        }

        pub fn ensure_is_member(&self, account: &AccountId) -> Vec<u128> {
            let caller_proposals = self
                .proposals_by_account
                .get(&account)
                .expect("Should be a DAO member");
            caller_proposals
        }

        pub fn ensure_pending_proposal(&self, proposal: &Proposal) {
            let is_pending = match &proposal.status {
                ProposalStatus::Pending => true,
                _ => false,
            };
            assert!(is_pending, "Proposal is active",)
        }

        pub fn execute_mint_message(
            &self,
            owner: AccountId,
            proposal_cid: ContentIdentifier,
        ) -> bool {
            let mint_result = build_call::<DefaultEnvironment>()
                .call(self.token_contract)
                .gas_limit(0)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("mint_property")))
                        .push_arg(&owner)
                        .push_arg(&proposal_cid),
                )
                .returns::<()>()
                .try_invoke();

            match mint_result {
                Ok(Ok(_)) => true,
                _ => false,
            }
        }
    }
    // #[cfg(test)]
    // mod tests {
    //     use super::*;

    // }
}
