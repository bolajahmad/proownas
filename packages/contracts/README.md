# Proownas DAO Contract

---
## What is Proownas

 Proownas is a community of real-estate owners. The goal is to allow an economy where real-estate owners can mutually benefit from the propoerties they own. It will allow owners to earn more from their properties and also have access to more properties without having to pay for them. We do this by minting real-world real-estate assets into NFTs.
---

---
## What does Proownas DAO do?

The purpose of the DAO is to collectively make decisions on properties, membership, values. Initially, the DAO is made up of few members who own all the propoerties. These members are able to review the qualifications of a new member. The DAO is tasked to verify that new member is real and can be located in the real world. To verify the existence of the properties described in the proposal and also confirm ownership of it. The DAO is also responsible minting new assets on-chain.
---

### Responsibilities

- Prove existence of a new member, and accept new member to the DAO
- Blacklist/Whitelist a member
- Vote on proposals (Proposals can be for submitting new asset which will also create a new user, submitting an opinion on what to build etc.)
- Verify existence of properties and link ownership to member(s)
- Mint properties on-chain as an NFT
- Determine the value of NFT (linked to the real-world asset.) and also
- Decide on the reward percentage and earning ratio


## Contracts

### The DAO

#### Storage

 ```
    #[ink(storage)]
    #[derive(Default)]
    pub struct DAO {
        cid_by_proposal_id: Mapping<u128, Vec<u8>>,
        proposal_by_id: Mapping<u128, Proposal>,
        proposals_by_account: Mapping<AccountId, Vec<u128>>,
        proposal_count: u128,
        votes_by_proposal: Mapping<(u128, AccountId), Vote>,
        assets_owned: Mapping<Vec<u8>, AccountId>,
        token_contract: AccountId,
    }
```

####  Messages

**Submit new asset**
Anyone can submit a new proposal/asset. Once a proposal is submitted, an off-chain verification process begins and the result of this off-chain process is announced by an Oracle (for now the Oracle is missing).

