# Contributing to EduVault

Thanks for contributing.

## Scope

EduVault is an in-development educational content marketplace with a current web prototype and a planned Stellar-native settlement layer. Contributions should improve one of these areas:

- product clarity
- security
- Soroban contract design
- developer experience
- accessibility
- documentation

## Before You Start

1. Read [README.md](README.md).
2. Review [docs/overview.md](docs/overview.md) and [docs/architecture.md](docs/architecture.md).
3. Open an issue before starting large changes so architecture and scope can be aligned early.

## Local Setup

```bash
npm install
cp .env.example .env.local
docker compose up -d mongodb
npm run dev
```

## Stellar / Soroban Setup

EduVault's settlement and entitlement layer runs on Stellar. If you are working on contracts, the indexer, or wallet integration, you need the following additional tools.

### Install Rust and Soroban CLI

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add the WASM target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli
```

### Configure the CLI for testnet

```bash
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

### Generate and fund a testnet identity

```bash
soroban keys generate --network testnet dev
curl "https://friendbot.stellar.org?addr=$(soroban keys address dev)"
```

### Build and test contracts

```bash
cd soroban
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### Environment variables for Stellar

Add these to your `.env.local` when working on Stellar features:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_MATERIAL_REGISTRY_CONTRACT_ID=<deployed contract ID>
NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID=<deployed contract ID>
NEXT_PUBLIC_SOROBAN_CONTRACT_ID=<PurchaseManager contract ID>
```

See [docs/stellar-integration.md](docs/stellar-integration.md) for the full setup walkthrough, architecture diagram, and frontend/backend integration code examples.

## Branching

- Use a short descriptive branch name such as `docs/stellar-submission` or `feat/entitlement-checks`.
- Keep pull requests focused. Avoid mixing documentation, refactors, and feature work unless the changes are tightly coupled.

## Coding Standards

- Keep changes small and reviewable.
- Prefer explicit naming over clever abstractions.
- Preserve the distinction between current prototype behavior and planned Stellar milestones.
- Do not claim a feature is on Stellar unless it is implemented and testable in this repository.
- Do not add new product work to the archived EVM prototype unless there is an explicit architecture decision to do so.
- Update documentation when architecture or environment requirements change.

## Pull Request Checklist

- The change is scoped and explained clearly.
- Relevant docs are updated.
- New environment variables are reflected in `.env.example`.
- Pull requests that change visible frontend behavior include screenshots or a short screen recording.
- Request/response examples are included when backend or API changes materially benefit from them.
- Any product or architectural assumptions are stated explicitly in the PR description.

## Commit Messages

Use concise, conventional commit messages when possible:

- `docs: rewrite README for Drip Wave submission`
- `chore: add contributor and license files`
- `docs: document Stellar architecture direction`
- `feat: add Soroban contract scaffolding`

## Reporting Issues

When opening an issue, include:

- expected behavior
- actual behavior
- reproduction steps
- screenshots or logs if relevant
- whether the issue affects the current prototype or the planned Stellar milestone

## Security

Do not disclose secrets, private keys, or production credentials in issues or pull requests. If you discover a sensitive security issue, contact the maintainer privately before public disclosure.
