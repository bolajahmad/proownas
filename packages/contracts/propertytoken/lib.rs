#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::implementation(PSP34, PSP34Mintable, Ownable, PSP34Metadata, PSP34Enumerable)]
#[openbrush::contract]
pub mod propertytoken {
    use openbrush::modifiers;
    use openbrush::traits::{Storage, String};

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct PropertyToken {
        #[storage_field]
        psp34: psp34::Data,
        #[storage_field]
        ownable: ownable::Data,
        #[storage_field]
        metadata: metadata::Data,
        #[storage_field]
        enumerable: enumerable::Data,
    }

    impl PropertyToken {
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut instance = Self::default();
            let collection_id = psp34::PSP34Impl::collection_id(&instance);
            let caller = Self::env().caller();

            ownable::Internal::_init_with_owner(&mut instance, caller);
            metadata::Internal::_set_attribute(
                &mut instance,
                collection_id.clone(),
                String::from("name"),
                String::from("ProownasPSPToken"),
            );
            metadata::Internal::_set_attribute(
                &mut instance,
                collection_id.clone(),
                String::from("symbol"),
                String::from("Pown34"),
            );

            instance
        }

        #[ink(message, payable)]
        pub fn mint(&mut self, account: AccountId, id: Vec<u8>) -> Result<(), PSP34Error> {
            self.mint_property(account, id)
        }

        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn mint_property(
            &mut self,
            to: AccountId,
            token_cid: Vec<u8>,
        ) -> Result<(), PSP34Error> {
            psp34::InternalImpl::_mint_to(self, to, Id::Bytes(token_cid.to_vec()))
        }

        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn burn_property(
            &mut self,
            from: AccountId,
            token_cid: Vec<u8>,
        ) -> Result<(), PSP34Error> {
            psp34::InternalImpl::_burn_from(self, from, Id::Bytes(token_cid.to_vec()))
        }
    }
}
