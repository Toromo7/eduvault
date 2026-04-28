# Stellar Integration Guide

## 1. Architecture Overview

EduVault has transitioned to a native Stellar/Soroban architecture.

- **Frontend:** Next.js with `@stellar/stellar-sdk`.
- **Contracts:** Soroban/Rust for on-chain logic.
- **Backend:** Next.js API for indexing.
- **Storage:** IPFS for educational materials.

## 2. Developer Environment Setup

### Network Configuration

```bash
soroban network add --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015" testnet
```

### Create a Test Identity

```bash
soroban keys generate dev_user
```

## 3. Integration Patterns

### A. Initializing the Stellar Connection

```js
import { Server } from '@stellar/stellar-sdk';

const server = new Server('https://soroban-testnet.stellar.org:443');
const networkPassphrase = 'Test SDF Network ; September 2015';
```

### B. Calling a Soroban Smart Contract

```js
import { Contract, xdr } from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CC...';
const contract = new Contract(CONTRACT_ID);

async function checkAccess(userPublicKey) {
  const tx = contract.call('has_access', xdr.ScVal.scvAddress(userPublicKey));
  const simulation = await server.simulateTransaction(tx);
  if (simulation.results) {
    console.log('Access Status:', simulation.results[0].retval);
  }
}
```

### C. Identity & Wallet Handling (Freighter)

```js
import { isConnected, getPublicKey } from '@stellar/freighter-api';

async function connectWallet() {
  if (await isConnected()) {
    const publicKey = await getPublicKey();
    return publicKey;
  }
}
```

```js
import { pinToIPFS } from '@/lib/ipfs';

// Example: Uploading a lesson note before saving the CID to Soroban
const cid = await pinToIPFS(fileData);
console.log('File pinned at:', cid);
```
