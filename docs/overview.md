# EduVault Overview

## Product Thesis

EduVault is building a rights-aware marketplace for educational materials. The product is designed for educators, tutors, student creators, and learning communities that need a better way to publish, discover, pay for, and verify access to academic resources.

## Target Users

- student creators selling class notes, prep guides, and practical templates
- educators publishing premium learning resources
- academic communities curating and distributing specialized content
- learners purchasing affordable, trustworthy materials across borders

## Primary Use Cases

- selling exam prep notes, lecture summaries, and practice packs
- distributing cohort-specific materials under explicit license terms
- enabling cross-border creator payouts for educational digital goods
- providing verifiable proof that a resource came from the original publisher
- supporting later issuance of access credits or institution-backed entitlements

## Current Repository State

The current repository already demonstrates key product mechanics:

- creator profile creation
- wallet-based onboarding
- document and thumbnail upload
- IPFS metadata creation through Pinata
- MongoDB-backed catalog storage
- dashboard and marketplace UI flows

The current blockchain implementation is an earlier EVM-based prototype and should be treated as an experiment, not the final chain direction.

## Proposed Stellar Direction

The next product milestone is to move the commercial logic onto Stellar:

- register materials and pricing terms on Soroban
- accept payments in XLM and Stellar-based stable assets
- store purchase entitlements on-chain
- verify access rights before file delivery
- support creator payouts and later institutional credits

## Why Stellar

EduVault is a better fit for Stellar than a generic NFT marketplace model because the commercial need is payment-centric. The core challenge is not collectible scarcity. It is low-cost settlement, verifiable access, and cross-border usability for educational commerce.

Stellar provides:

- low-cost transactions suitable for small purchases
- strong fit for cross-border payments and stable assets
- asset issuance for access credits, scholarships, and publisher-issued tokens
- Soroban for contract-based entitlement and payout logic

## Ecosystem Value

EduVault can contribute useful transaction volume to Stellar in a category with long-term demand: learning and upskilling. It also creates a practical open-source reference for digital content licensing on Stellar instead of another purely financial dashboard or speculative token flow.

## Delivery Principle

The project should be presented honestly:

- current app prototype is real and functional
- Stellar-native payments and entitlement logic are the next milestone
- documentation must distinguish shipped functionality from planned work
