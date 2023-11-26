#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod multisig {
    use ink::env::{
        call::{build_call, utils::ArgumentList, ExecutionInput},
        CallFlags,
    };
    use ink::prelude::vec::Vec;
    use ink::storage::traits::StorageLayout;
    use ink::storage::Mapping;
    use scale::{Decode, Encode, Output};

    /// An enum representing the list of encodable functions
    /// These functions can be encoded, arguments included, and used to build the Transaction struct
    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub enum EncodableFunctions {
        AddOwner(AccountId),
        RemoveOwner(AccountId),
        Invoke(u32),
    }

    type TransactionId = u32;
    const MAX_OWNERS: u8 = 50;

    struct CallInput<'a>(&'a [u8]);
    impl<'a> scale::Encode for CallInput<'a> {
        fn encode_to<T: Output + ?Sized>(&self, dest: &mut T) {
            dest.write(self.0);
        }
    }

    #[derive(Copy, Clone, Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Returned if the call failed.
        TransactionFailed,
    }

    /// Emitted when an owner confirms a transaction.
    #[ink(event)]
    pub struct Confirmation {
        /// The transaction that was confirmed.
        #[ink(topic)]
        transaction: TransactionId,
        /// The owner that sent the confirmation.
        #[ink(topic)]
        from: AccountId,
        /// The confirmation status after this confirmation was applied.
        #[ink(topic)]
        status: ConfirmationStatus,
    }

    /// Emitted when an owner revoked a confirmation.
    #[ink(event)]
    pub struct Revocation {
        /// The transaction that was revoked.
        #[ink(topic)]
        transaction: TransactionId,
        /// The owner that sent the revocation.
        #[ink(topic)]
        from: AccountId,
    }

    /// Emitted when an owner submits a transaction.
    #[ink(event)]
    pub struct Submission {
        /// The transaction that was submitted.
        #[ink(topic)]
        transaction: TransactionId,
        #[ink(topic)]
        callee: AccountId,
        name: [u8; 4],
    }

    /// Emitted when a transaction was canceled.
    #[ink(event)]
    pub struct Cancellation {
        /// The transaction that was canceled.
        #[ink(topic)]
        transaction: TransactionId,
    }

    /// Emitted when a transaction was executed.
    #[ink(event)]
    pub struct Execution {
        /// The transaction that was executed.
        #[ink(topic)]
        transaction: TransactionId,
        /// Indicates whether the transaction executed successfully. If so the `Ok` value
        /// holds the output in bytes. The Option is `None` when the transaction
        /// was executed through `invoke_transaction` rather than
        /// `evaluate_transaction`.
        #[ink(topic)]
        result: Result<Option<Vec<u8>>, Error>,
    }

    /// Emitted when an owner is added to the wallet.
    #[ink(event)]
    pub struct OwnerAddition {
        /// The owner that was added.
        #[ink(topic)]
        owner: AccountId,
        /// The block number where owner was added
        when: u32,
    }

    /// Emitted when an owner is removed from the wallet.
    #[ink(event)]
    pub struct OwnerRemoval {
        /// The owner that was removed.
        #[ink(topic)]
        owner: AccountId,
        /// The block number where owner was removed
        when: u32,
    }

    /// Emitted when the requirement changed.
    #[ink(event)]
    pub struct RequirementChange {
        /// The new requirement value.
        new_requirement: u32,
    }

    #[derive(Copy, Clone, Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum ConfirmationStatus {
        /// The transaction is already confirmed.
        Confirmed,
        /// Indicates how many confirmations are remaining.
        ConfirmationsNeeded(u32),
    }

    #[derive(Encode, Decode)]
    #[cfg_attr(
        feature = "std",
        derive(Debug, Clone, PartialEq, Eq, scale_info::TypeInfo, StorageLayout,)
    )]
    pub struct Transaction {
        /// The `AccountId` of the contract that is called in this transaction.
        pub callee: AccountId,
        /// The selector bytes that identifies the function of the callee that should be
        /// called.
        pub selector: [u8; 4],
        /// The SCALE encoded parameters that are passed to the called function.
        pub input: Vec<u8>,
        /// The amount of chain balance that is transferred to the callee.
        pub transferred_value: Balance,
        /// Gas limit for the execution of the call.
        pub gas_limit: u64,
        /// If set to true the transaction will be allowed to re-enter the multisig
        /// contract. Re-entrancy can lead to vulnerabilities. Use at your own
        /// risk.
        pub allow_reentry: bool,
    }

    #[derive(Default, Decode, Encode)]
    #[cfg_attr(
        feature = "std",
        derive(
            Debug,
            PartialEq,
            Eq,
            scale_info::TypeInfo,
            ink::storage::traits::StorageLayout
        )
    )]
    pub struct Transactions {
        /// Just store all transaction ids packed.
        transactions: Vec<TransactionId>,
        /// We just increment this whenever a new transaction is created.
        /// We never decrement or defragment. For now, the contract becomes defunct
        /// when the ids are exhausted.
        next_id: TransactionId,
    }

    #[ink(storage)]
    #[derive(Default)]
    pub struct Multisig {
        /// Every entry in this map represents the confirmation of an owner for a
        /// transaction. This is effectively a set rather than a map.
        confirmations: Mapping<(TransactionId, AccountId), ()>,
        /// The amount of confirmations for every transaction. This is a redundant
        /// information and is kept in order to prevent iterating through the
        /// confirmation set to check if a transaction is confirmed.
        confirmation_count: Mapping<TransactionId, u32>,
        /// Map the transaction id to its not-executed transaction.
        transactions: Mapping<TransactionId, Transaction>,
        /// We need to hold a list of all transactions so that we can clean up storage
        /// when an owner is removed.
        transaction_list: Transactions,
        /// The list is a vector because iterating over it is necessary when cleaning
        /// up the confirmation set.
        owners: Vec<AccountId>,
        /// Redundant information to speed up the check whether a caller is an owner.
        is_owner: Mapping<AccountId, ()>,
        /// Minimum number of owners that have to confirm a transaction to be executed.
        requirement: u32,
    }

    impl Multisig {
        #[ink(constructor)]
        pub fn new(requirement: u32, mut owners: Vec<AccountId>) -> Self {
            let mut contract = Multisig::default();
            owners.sort_unstable();
            owners.dedup();
            ensure_requirement_is_valid(owners.len() as u32, requirement);

            for owner in &owners {
                contract.is_owner.insert(owner, &());
            }

            contract.owners = owners;
            contract.transaction_list = Default::default();
            contract.requirement = requirement;
            contract
        }

        #[ink(message)]
        pub fn add_owner(&mut self, new_owner: AccountId) {
            self.ensure_from_wallet();
            self.ensure_no_owner(&new_owner);
            ensure_requirement_is_valid(self.owners.len() as u32 + 1, self.requirement);
            self.is_owner.insert(new_owner, &());
            self.owners.push(new_owner);
            self.env().emit_event(OwnerAddition {
                owner: new_owner,
                when: self.env().block_number(),
            });
        }

        #[ink(message)]
        pub fn retrieve_owners(&self) -> (Vec<AccountId>, u32) {
            (self.owners.clone(), self.owners.len() as u32)
        }

        #[ink(message)]
        pub fn remove_owner(&mut self, owner: AccountId) {
            self.ensure_from_wallet();
            self.ensure_owner(&owner);
            let len = self.owners.len() as u32 - 1;
            let requirement = u32::min(len, self.requirement);
            ensure_requirement_is_valid(len, requirement);
            let owner_index = self.owner_index(&owner) as usize;
            self.owners.swap_remove(owner_index);
            self.is_owner.remove(owner);
            self.requirement = requirement;
            self.clean_owner_confirmations(&owner);
            self.env().emit_event(OwnerRemoval {
                owner,
                when: self.env().block_number(),
            });
        }

        #[ink(message)]
        pub fn replace_owner(&mut self, old_owner: AccountId, new_owner: AccountId) {
            self.ensure_from_wallet();
            self.ensure_owner(&old_owner);
            self.ensure_no_owner(&new_owner);
            let owner_index = self.owner_index(&old_owner);
            self.owners[owner_index as usize] = new_owner;
            self.is_owner.remove(old_owner);
            self.is_owner.insert(new_owner, &());
            self.clean_owner_confirmations(&old_owner);
            self.env().emit_event(OwnerRemoval {
                owner: old_owner,
                when: self.env().block_number(),
            });
            self.env().emit_event(OwnerAddition {
                owner: new_owner,
                when: self.env().block_number(),
            });
        }

        #[ink(message)]
        pub fn change_requirement(&mut self, requirement: u32) {
            self.ensure_from_wallet();
            ensure_requirement_is_valid(self.owners.len() as u32, requirement);
            self.requirement = requirement;
            self.env().emit_event(RequirementChange {
                new_requirement: requirement,
            });
        }

        /// Add a new transaction candidate to the contract.
        ///
        /// This also confirms the transaction for the caller. This can be called by any
        /// owner.
        #[ink(message)]
        pub fn submit_transaction(
            &mut self,
            transaction: Transaction,
        ) -> (TransactionId, ConfirmationStatus) {
            self.ensure_caller_is_owner();
            let trans_id = self.transaction_list.next_id;
            self.transaction_list.next_id =
                trans_id.checked_add(1).expect("Transaction ids exhausted.");
            self.transactions.insert(trans_id, &transaction);
            self.transaction_list.transactions.push(trans_id);
            self.env().emit_event(Submission {
                transaction: trans_id,
                callee: transaction.callee,
                name: transaction.selector,
            });

            (
                trans_id,
                self.confirm_by_caller(self.env().caller(), trans_id),
            )
        }

        #[ink(message)]
        pub fn cancel_transaction(&mut self, trans_id: TransactionId) {
            self.ensure_from_wallet();
            if self.take_transaction(trans_id).is_some() {
                self.env().emit_event(Cancellation {
                    transaction: trans_id,
                });
            }
        }

        /// Confirm a transaction for the sender that was submitted by any owner.
        ///
        /// This can be called by any owner.
        ///
        /// # Panics
        ///
        /// If `trans_id` is no valid transaction id.
        #[ink(message)]
        pub fn confirm_transaction(&mut self, trans_id: TransactionId) -> ConfirmationStatus {
            self.ensure_caller_is_owner();
            self.ensure_transaction_exists(trans_id);
            self.confirm_by_caller(self.env().caller(), trans_id)
        }

        #[ink(message)]
        pub fn revoke_confirmation(&mut self, trans_id: TransactionId) {
            self.ensure_caller_is_owner();
            let caller = self.env().caller();
            if self.confirmations.contains((trans_id, caller)) {
                self.confirmations.remove((trans_id, caller));
                let mut confirmation_count = self
                    .confirmation_count
                    .get(trans_id)
                    .expect("There is a entry in `self.confirmations`. Hence a count must exit.");
                // Will not underflow as there is at least one confirmation
                confirmation_count -= 1;
                self.confirmation_count
                    .insert(trans_id, &confirmation_count);
                self.env().emit_event(Revocation {
                    transaction: trans_id,
                    from: caller,
                });
            }
        }

        #[ink(message)]
        pub fn encode_function_name_and_input(
            &self,
            args: EncodableFunctions,
        ) -> ([u8; 4], Vec<u8>) {
            match args {
                EncodableFunctions::AddOwner(account) => {
                    // let mut content: Vec<ContentIdentifier> = Vec::new();
                    // content.push("".into());
                    let encoded_name = ink::selector_bytes!("add_owner");
                    let inputs = ArgumentList::empty().push_arg(&account);
                    let encoded_inputs = inputs.encode();
                    (encoded_name, encoded_inputs)
                }
                EncodableFunctions::RemoveOwner(account) => {
                    let encoded_name = ink::selector_bytes!("remove_owner");
                    let inputs = ArgumentList::empty().push_arg(&account);
                    let encoded_inputs = inputs.encode();
                    (encoded_name, encoded_inputs)
                }
                EncodableFunctions::Invoke(trans_id) => {
                    let encoded_name = ink::selector_bytes!("invoke_transaction");
                    let inputs = ArgumentList::empty().push_arg(&trans_id);
                    let encoded_inputs = inputs.encode();
                    (encoded_name, encoded_inputs)
                }
            }
        }

        #[ink(message)]
        pub fn invoke_transaction(&mut self, trans_id: TransactionId) -> Result<(), Error> {
            self.ensure_confirmed(trans_id);
            let t = self
                .take_transaction(trans_id)
                .expect("The user specified an invalid transaction id. Abort.");
            assert!(self.env().transferred_value() == t.transferred_value);

            let result = build_call::<<Self as ::ink::env::ContractEnv>::Env>()
                .call(t.callee)
                .gas_limit(t.gas_limit)
                .transferred_value(t.transferred_value)
                .call_flags(CallFlags::default().set_allow_reentry(t.allow_reentry))
                .exec_input(ExecutionInput::new(t.selector.into()).push_arg(CallInput(&t.input)))
                .returns::<()>()
                .try_invoke();

            let result = match result {
                Ok(Ok(_)) => Ok(()),
                _ => Err(Error::TransactionFailed),
            };
            self.env().emit_event(Execution {
                transaction: trans_id,
                result: result.map(|_| None),
            });
            result
        }

        #[ink(message, payable)]
        pub fn eval_transaction(&mut self, trans_id: TransactionId) -> Result<Vec<u8>, Error> {
            self.ensure_confirmed(trans_id);
            let t = self
                .take_transaction(trans_id)
                .expect("The user specified an invalid transaction id. Abort.");
            let result = build_call::<<Self as ::ink::env::ContractEnv>::Env>()
                .call(t.callee)
                .gas_limit(t.gas_limit)
                .transferred_value(t.transferred_value)
                .call_flags(CallFlags::default().set_allow_reentry(t.allow_reentry))
                .exec_input(ExecutionInput::new(t.selector.into()).push_arg(CallInput(&t.input)))
                .returns::<Vec<u8>>()
                .try_invoke();

            let result = match result {
                Ok(Ok(v)) => Ok(v),
                _ => Err(Error::TransactionFailed),
            };

            self.env().emit_event(Execution {
                transaction: trans_id,
                result: result.clone().map(Some),
            });
            result
        }

        /// Get the index of `owner` in `self.owners`.
        /// Panics if `owner` is not found in `self.owners`.
        fn owner_index(&self, owner: &AccountId) -> u32 {
            self.owners.iter().position(|x| *x == *owner).expect(
                "This is only called after it was already verified that the id is
                 actually an owner.",
            ) as u32
        }

        /// Remove all confirmation state associated with `owner`.
        /// Also adjusts the `self.confirmation_count` variable.
        fn clean_owner_confirmations(&mut self, owner: &AccountId) {
            for trans_id in &self.transaction_list.transactions {
                let key = (*trans_id, *owner);
                if self.confirmations.contains(key) {
                    self.confirmations.remove(key);
                    let mut count = self.confirmation_count.get(trans_id).unwrap_or(0);
                    count -= 1;
                    self.confirmation_count.insert(trans_id, &count);
                }
            }
        }

        /// Remove the transaction identified by `trans_id` from `self.transactions`.
        /// Also removes all confirmation state associated with it.
        fn take_transaction(&mut self, trans_id: TransactionId) -> Option<Transaction> {
            let transaction = self.transactions.get(trans_id);
            if transaction.is_some() {
                self.transactions.remove(trans_id);
                let pos = self
                    .transaction_list
                    .transactions
                    .iter()
                    .position(|t| t == &trans_id)
                    .expect("The transaction exists hence it must also be in the list.");
                self.transaction_list.transactions.swap_remove(pos);
                for owner in self.owners.iter() {
                    self.confirmations.remove((trans_id, *owner));
                }
                self.confirmation_count.remove(trans_id);
            }
            transaction
        }

        fn confirm_by_caller(
            &mut self,
            confirmer: AccountId,
            transaction: TransactionId,
        ) -> ConfirmationStatus {
            let mut count = self.confirmation_count.get(transaction).unwrap_or(0);
            let key = (transaction, confirmer);
            let new_confirmation = !self.confirmations.contains(key);
            if new_confirmation {
                count += 1;
                self.confirmations.insert(key, &());
                self.confirmation_count.insert(transaction, &count);
            }
            let status = {
                if count >= self.requirement {
                    ConfirmationStatus::Confirmed
                } else {
                    ConfirmationStatus::ConfirmationsNeeded(self.requirement - count)
                }
            };
            if new_confirmation {
                self.env().emit_event(Confirmation {
                    transaction,
                    from: confirmer,
                    status,
                });
            }
            status
        }

        /// Panic if transaction `trans_id` is not confirmed by at least
        /// `self.requirement` owners.
        fn ensure_confirmed(&self, trans_id: TransactionId) {
            assert!(
                self.confirmation_count
                    .get(trans_id)
                    .expect("The user specified an invalid transaction id. Abort.")
                    >= self.requirement
            );
        }

        /// Panic if the transaction `trans_id` does not exit.
        fn ensure_transaction_exists(&self, trans_id: TransactionId) {
            self.transactions
                .get(trans_id)
                .expect("The user specified an invalid transaction id. Abort.");
        }

        /// Panic if the sender is no owner of the wallet.
        fn ensure_caller_is_owner(&self) {
            self.ensure_owner(&self.env().caller());
        }

        /// Panic if the sender is not this wallet.
        fn ensure_from_wallet(&self) {
            assert_eq!(self.env().caller(), self.env().account_id());
        }

        /// Panic if `owner` is not an owner,
        fn ensure_owner(&self, owner: &AccountId) {
            assert!(self.is_owner.contains(owner));
        }

        /// Panic if `owner` is an owner.
        fn ensure_no_owner(&self, owner: &AccountId) {
            assert!(!self.is_owner.contains(owner));
        }
    }

    /// Panic if the number of `owners` under a `requirement` violates our
    /// requirement invariant.
    fn ensure_requirement_is_valid(owners: u32, requirement: u32) {
        assert!(0 < requirement && requirement <= owners && owners <= MAX_OWNERS as u32);
    }
}
