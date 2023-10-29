# Proownas DAO Contract

---

## What is Proownas

## Proownas is a community of real-estate owners. The goal is to allow an economy where real-estate owners can mutually benefit from the propoerties they own. It will allow owners to earn more from their properties and also have access to more properties without having to pay for them. We do this by minting real-world real-estate assets into NFTs.

---

## What does Proownas DAO do?

## The purpose of the DAO is to collectively make decisions on properties, membership, values. Initially, the DAO is made up of few members who own all the propoerties. These members are able to review the qualifications of a new member. The DAO is tasked to verify that new member is real and can be located in the real world. To verify the existence of the properties described in the proposal and also confirm ownership of it. The DAO is also responsible minting new assets on-chain.

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

A typical process for the DAO involves moving proposals between status. A proposal can be anything and the content is only made known by the proposal_cid that every Proposal must contain. Since voting is reviewed and decided off-chain anyway, we don't have to know what the proposal is about on-chain.

### DAO Constructor

To create a new DAO contract, the creator has to provide a CID representing their existing asset(s). This is a list of ContentIdentifier `Vec<ContentIdentifier>`. This mints the provided assets as the caller's.

A Typical Proposal goes through the following steps:

Start with `submit_new_proposal`. This will change the ProposalStatus to Pending and pretty much initialize the Proposal.

Pending -> Ongoing -> Approved -> (Execute proposal [For new asset, or joining the DAO call the create_proposal_asset])

Pending -> Ongoing -> Rejected -> (Close proposal and take no further action. Users can submit new proposal)

When a proposal has been reviewed and the DAO is ready to accept votes on it, need to call the `activate_voting` message. This will update the ProposalStatus to Ongoing and also trigger a countdown, based on the Proposal's duration, during which any member of the DAO can vote.

Once the voting period is over, call the `close_voting_period` message. This message will try to conclude the voting and based on the Vote results, update the ProposalStatus to Approved or Pending

For now, the possible proposals are only for joining the DAO (Submitting a new asset). When the proposal is approved, we can the execute the `create_proposal_asset` message to mint a new asset on-chain. For this to be successful, the DAO must have added default asets and update the storage to `has_set_default_assets=true`.

A very important aspect of the DAO contract is the token_contract storage. This must be updated before minting can be possible.

### The NFT Wizard Contract

This is the powerhouse PSP34 token contract that manages the minting and burning of Synthetic assets on-chain. This is based heavily on the (PSP34 specifications)[https://openbrush.brushfam.io/] with some modifications. The NFT Wizard is going to be owned by the (DAO Contract)[file://./dao/lib.rs]. This can be done by calling the transfer_ownership message that exists on the Ownable contract. This can be called, naturally by a Multisig, by anyone in the DAO (for simplicity).This contract implements the necessary contracts such as
`PSP34, PSP34Mintable, Ownable, PSP34Metadata, PSP34Enumerable`.

### The Multisig contract

The multisig is borrowed from the list of ink-examples, the multisig contract. Refer to the (Multisig contract example)[https://github.com/paritytech/ink-examples/blob/main/multisig/lib.rs] by the parity tea. This Multisig is based totally on it with adjustment to the retrieve_owners function.
