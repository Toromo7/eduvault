# Stellar Integration Guide

This guide covers the architecture, local setup, and integration patterns contributors need to work on EduVault's Stellar-native layer.

## Architecture Overview

EduVault uses Stellar and Soroban for settlement and access rights. File bytes stay off-chain. The chain handles payment, entitlement, and payout routing.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Wallet                      │
│  Next.js App  ──sign tx──▶  Stellar Wallets Kit             │
└────────────────────────┬────────────────────────────────────┘
                         │ signed XDR
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Stellar Network                          │
│                                                              │
│  ┌──────────────────────┐   ┌──────────────────────────┐   │
│  │   MaterialRegistry   │   │    PurchaseManager        │   │
│  │  (Soroban contract)  │   │   (Soroban contract)      │   │
│  │                      │   │                           │   │
│  │  - register material │   │  - accept payment         │   │
│  │  - store rights hash │   │  - record entitlement     │   │
│  │  - store quotes      │   │  - route payouts          │   │
│  └──────────────────────┘   └──────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ events via Horizon / RPC
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Next.js API)                      │
│                                                              │
│  Indexer ──▶ MongoDB (purchases, entitlement_cache)         │
│  Download gate ──▶ verifies entitlement before file access  │
│                                                              │
│  IPFS / Pinata ──▶ stores file bytes and metadata JSON      │
└─────────────────────────────────────────────────────────────┘
```

### How the pieces interact

1. Creator uploads a file — backend pins it to IPFS via Pinata and stores metadata in MongoDB.
2. Creator registers the material on `MaterialRegistry` with a price quote and payout shares.
3. Buyer initiates checkout — frontend builds a Soroban transaction and asks the wallet to sign it.
4. `PurchaseManager` receives payment, records the entitlement on-chain, and routes payouts atomically.
5. Indexer reads `purchase.completed` events from Horizon and writes a cache record to MongoDB.
6. When the buyer requests a download, the API checks the entitlement cache (falling back to a direct contract read) before returning the IPFS gateway URL.

---

## Dev Environment Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Soroban CLI | latest | `cargo install --locked soroban-cli` |
| Docker | any recent | [docker.com](https://docker.com) |

### 1. Clone and install

```bash
git clone https://github.com/Obiajulu-gif/eduvault.git
cd eduvault
npm install
cp .env.example .env.local
```

### 2. Configure environment

Fill in `.env.local` with at minimum:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/eduvault
JWT_SECRET=a-long-random-string-at-least-32-chars
PINATA_JWT=your-pinata-jwt
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

Leave `NEXT_PUBLIC_SOROBAN_CONTRACT_ID`, `NEXT_PUBLIC_MATERIAL_REGISTRY_CONTRACT_ID`, and `NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID` empty until you deploy contracts locally.

### 3. Start MongoDB

```bash
docker compose up -d mongodb
```

### 4. Start the web app

```bash
npm run dev
```

### 5. Set up Soroban CLI for testnet

Configure the CLI to use the Stellar testnet:

```bash
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

Generate a testnet identity and fund it via Friendbot:

```bash
soroban keys generate --network testnet alice
soroban keys address alice
# Copy the address, then fund it:
curl "https://friendbot.stellar.org?addr=<YOUR_ADDRESS>"
```

### 6. Build and deploy contracts locally

```bash
cd soroban
cargo build --target wasm32-unknown-unknown --release

# Deploy MaterialRegistry
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/material_registry.wasm \
  --source alice \
  --network testnet

# Deploy PurchaseManager
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/purchase_manager.wasm \
  --source alice \
  --network testnet
```

Copy the returned contract IDs into `.env.local`:

```env
NEXT_PUBLIC_MATERIAL_REGISTRY_CONTRACT_ID=C...
NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID=C...
NEXT_PUBLIC_SOROBAN_CONTRACT_ID=C...  # PurchaseManager ID
```

### 7. Run contract tests

```bash
cd soroban
cargo test
```

---

## Integration Patterns

### Calling Soroban contracts from the frontend

The frontend uses `@stellar/stellar-sdk` to build and submit transactions. The wallet signs via `@creit-tech/stellar-wallets-kit`.

#### Reading contract state (no signature needed)

```js
import { Contract, SorobanRpc, scValToNative, xdr } from '@stellar/stellar-sdk';

const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL);
const contractId = process.env.NEXT_PUBLIC_MATERIAL_REGISTRY_CONTRACT_ID;

export async function getMaterial(materialId) {
  const contract = new Contract(contractId);

  const result = await server.simulateTransaction(
    new TransactionBuilder(/* source account */)
      .addOperation(
        contract.call('get_material', xdr.ScVal.scvBytes(Buffer.from(materialId, 'hex')))
      )
      .build()
  );

  return scValToNative(result.result.retval);
}
```

#### Checking entitlement

```js
import { Contract, SorobanRpc, scValToNative, Address, xdr } from '@stellar/stellar-sdk';

export async function hasEntitlement(materialId, buyerAddress) {
  const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL);
  const contract = new Contract(process.env.NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID);

  const result = await server.simulateTransaction(
    new TransactionBuilder(/* source account */)
      .addOperation(
        contract.call(
          'has_entitlement',
          xdr.ScVal.scvBytes(Buffer.from(materialId, 'hex')),
          new Address(buyerAddress).toScVal()
        )
      )
      .build()
  );

  return scValToNative(result.result.retval); // true | false
}
```

#### Submitting a purchase (requires wallet signature)

```js
import {
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { useContext } from 'react';
import { WalletContext } from '@/providers/WalletProvider';

export async function purchaseMaterial({ materialId, asset, expectedAmount, buyerAddress }) {
  const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL);
  const contract = new Contract(process.env.NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID);

  // 1. Load buyer account
  const account = await server.getAccount(buyerAddress);

  // 2. Build transaction
  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'purchase',
        xdr.ScVal.scvBytes(Buffer.from(materialId, 'hex')),
        new Address(asset).toScVal(),
        nativeToScVal(expectedAmount, { type: 'i128' })
      )
    )
    .setTimeout(30)
    .build();

  // 3. Simulate to get footprint
  const simResult = await server.simulateTransaction(tx);
  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();

  // 4. Sign via wallet kit (from WalletContext)
  const signedXdr = await signTransaction(preparedTx.toXDR(), { address: buyerAddress });

  // 5. Submit
  const response = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
  );

  return response; // { hash, status }
}
```

### Calling Soroban contracts from the backend (API routes)

Backend routes use the SDK in server-only mode for entitlement verification:

```js
import { Contract, SorobanRpc, scValToNative, Address, xdr, TransactionBuilder, Keypair, Networks } from '@stellar/stellar-sdk';

export async function verifyEntitlementOnChain(materialId, buyerAddress) {
  const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_STELLAR_RPC_URL);
  const contract = new Contract(process.env.NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID);

  // Use a read-only ephemeral keypair — no funds needed for simulation
  const source = Keypair.random();
  const account = new Account(source.publicKey(), '0');

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'has_entitlement',
        xdr.ScVal.scvBytes(Buffer.from(materialId, 'hex')),
        new Address(buyerAddress).toScVal()
      )
    )
    .setTimeout(10)
    .build();

  const result = await server.simulateTransaction(tx);
  return scValToNative(result.result.retval); // true | false
}
```

### Reading events from Horizon (indexer pattern)

```js
import StellarSdk from '@stellar/stellar-sdk';

const server = new StellarSdk.Horizon.Server(process.env.NEXT_PUBLIC_HORIZON_URL);
const contractId = process.env.NEXT_PUBLIC_PURCHASE_MANAGER_CONTRACT_ID;

export async function fetchPurchaseEvents(cursor = 'now') {
  const records = await server
    .transactions()
    .forAccount(contractId)
    .cursor(cursor)
    .order('asc')
    .limit(50)
    .call();

  return records.records.map((tx) => ({
    hash: tx.hash,
    ledger: tx.ledger_attr,
    createdAt: tx.created_at,
  }));
}
```

---

## Network Reference

| Network | RPC URL | Horizon URL | Passphrase |
|---------|---------|-------------|------------|
| Testnet | `https://soroban-testnet.stellar.org` | `https://horizon-testnet.stellar.org` | `Test SDF Network ; September 2015` |
| Mainnet | `https://mainnet.stellar.validationcloud.io/v1/<key>` | `https://horizon.stellar.org` | `Public Global Stellar Network ; September 2015` |

Testnet tokens: use [Friendbot](https://friendbot.stellar.org) to fund testnet accounts.

---

## Further Reading

- [docs/architecture.md](architecture.md) — full system architecture
- [docs/soroban-contract-architecture.md](soroban-contract-architecture.md) — contract boundary, storage model, and event contract
- [docs/backend-contracts.md](backend-contracts.md) — MongoDB schema and indexer alignment
- [Soroban docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar SDK JS](https://stellar.github.io/js-stellar-sdk/)
