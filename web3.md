# AERO-EARTH: Web3 Integration — Complete Workflow

## Overview

AERO-EARTH is an environmental monitoring platform (AQI, Solar, Water) built on CesiumJS. This document defines the **complete workflow** for integrating **Algorand blockchain** to solve 5 critical loopholes in traditional environmental platforms.

---

## The 5 Loopholes & Blockchain Solutions

| # | Loophole (Problem) | Solution | Why Blockchain Is Needed |
|---|---|---|---|
| 1 | **AQI data can be faked/tampered** — stations report whatever they want, no audit trail | **Data Oracle**: Hash every AQI reading on-chain → immutable, verifiable record | Without on-chain hashing, anyone can retroactively change historical AQI data. Blockchain makes every reading permanent and publicly auditable |
| 2 | **Carbon claims are unverifiable** — users see "22 kg CO₂/year offset" but no proof they actually planted a tree | **GreenProof NFTs**: Mint verifiable proof-of-action NFTs with geolocatioFn + timestamp | A database entry saying "tree planted" can be deleted or faked. An NFT with geotagged photo on IPFS and on-chain metadata is permanent proof |
| 3 | **No accountability for "Get Quote"** — user clicks quote, nothing is tracked or enforced | **Smart Contract Commitments**: Lock a small stake, refund on verification | Without a stake, "Get Quote" is a dead-end click. Smart contract escrow creates real commitment with financial accountability |
| 4 | **No incentive to take green action** — the app shows impact but doesn't reward anyone | **AERO Tokens (ASA)**: Earn tokens for verified green actions, spend on platform features | Traditional points systems are centralized and meaningless. On-chain tokens have real scarcity, transferability, and verifiable distribution |
| 5 | **Solar/Water savings claims can't be audited** — anyone can inflate projected savings | **On-chain Calculation Proofs**: Hash calculation inputs + outputs for transparency | Without proof, a vendor can claim "saves ₹50,000/year" with no way to verify. On-chain hash of inputs + formula + outputs = fully auditable |

---

## Algorand Tools We Will Use

### Core Development

| Tool | Purpose in AERO-EARTH | Phase |
|---|---|---|
| **AlgoKit CLI** | Project setup (`algokit init`), local sandbox (`algokit localnet start`), deployment (`algokit deploy`) | All phases |
| **Lora (AlgoKit)** | Visual explorer for testing contracts on LocalNet — inspect transactions, app state, ASA balances during development | Development & Testing |
| **PyTeal** | Write all 5 smart contracts in Python with type-safety, compile to TEAL bytecode | Smart Contract Development |

### SDKs

| SDK | Purpose | Where Used |
|---|---|---|
| **JavaScript/TypeScript SDK (`algosdk`)** | Frontend wallet connection, transaction building, contract interaction from React app | Frontend (React) |
| **Python SDK (`py-algorand-sdk`)** | Backend oracle service, deployment scripts, contract compilation, testing | Backend services, CI/CD |

### Wallets

| Wallet | Purpose |
|---|---|
| **Pera Wallet** | Primary user wallet — connect from browser, sign transactions, view AERO tokens and GreenProof NFTs |
| **Defly Wallet** | Alternative wallet option for users who prefer DeFi-focused features |

### Explorers & Analytics

| Tool | Purpose |
|---|---|
| **Pera Explorer** | Public verification — anyone can look up a GreenProof NFT, AQI data hash, or AERO transaction |
| **Dappflow** | Monitor contract health, track AERO token distribution, debug failed transactions |
| **Algorand Metrics Dashboard** | Track network-level stats — total AERO supply, transaction volume, contract calls |

### Key Algorand Features Used

| Feature | Used For |
|---|---|
| **Algorand Standard Assets (ASA)** | AERO Token (fungible), GreenProof NFTs (non-fungible, total=1) |
| **Stateful Smart Contracts** | AQI Oracle, Commitment Escrow, AERO Rewards, Calculation Proofs |
| **Inner Transactions** | Contract-to-contract calls — e.g., GreenProof contract mints ASA NFT via inner txn |
| **Atomic Transfers** | Group "commitment stake payment + app call" into one atomic operation |
| **Box Storage** | Store large AQI reading history per station (exceeds global state limits) |
| **Pure Proof-of-Stake** | Fast finality (~3.3s), low fees (~0.001 ALGO), carbon-negative network |

---

## Feature 1: AQI Data Oracle — Immutable Air Quality Records

### Problem Deep-Dive
- AQI stations report data to our app, but nothing stops the data from being changed after the fact
- A station could report AQI 50 (Good) when reality is AQI 200 (Very Unhealthy) — no audit trail
- Historical data can be silently modified in the database
- Users and regulators have no way to verify if current or past readings are genuine

### Solution: On-Chain Data Hashing

Every AQI reading gets SHA-256 hashed and stored on Algorand. The raw data goes to IPFS. Anyone can verify by re-hashing the raw data and comparing with the on-chain hash.

### Complete Workflow

```
Step 1: Data Collection
├── IoT sensor / AQI API sends reading to our backend
├── Reading contains: station_id, aqi, pm25, pm10, o3, no2, timestamp, GPS coordinates
└── Backend receives and validates the data format

Step 2: Hash & Store
├── Backend creates deterministic JSON (sorted keys, no whitespace)
├── SHA-256 hash of the canonical JSON → 32-byte hash
├── Full JSON uploaded to IPFS via Pinata → returns IPFS CID
└── Backend calls AQI Oracle smart contract with: hash + station_id + timestamp + IPFS CID

Step 3: On-Chain Storage
├── Smart contract (PyTeal, Stateful) stores:
│   ├── Global state: latest_hash, latest_timestamp, reading_count
│   ├── Box storage: per-station history (station_id → [hash1, hash2, ...])
│   └── Mapping: composite key r_{station_id}_{timestamp} → hash
└── Transaction confirmed in ~3.3 seconds on Algorand

Step 4: Frontend Display
├── React app fetches AQI data as usual
├── Additionally fetches on-chain hash for the reading via JS SDK
├── Displays "✓ On-Chain Verified" badge next to each station
└── Badge links to Pera Explorer showing the transaction

Step 5: Verification (by anyone)
├── User/auditor downloads raw data from IPFS using the CID
├── Re-hashes the data using same SHA-256 algorithm
├── Compares recomputed hash with on-chain hash
└── Match = data is authentic and untampered
```

### Tools Used
- **PyTeal** → Write AQI Oracle stateful contract
- **AlgoKit CLI** → Deploy contract to LocalNet → TestNet → MainNet
- **Python SDK** → Backend oracle service (cron job every 30 min)
- **JS SDK** → Frontend reads on-chain hash for verification badge
- **Lora** → Test and debug contract state during development
- **Pera Explorer** → Public link for users to verify any reading
- **IPFS (Pinata)** → Store full raw data off-chain (on-chain stores only hash)

### Smart Contract: AQI Oracle
- **Type**: Stateful Application (PyTeal)
- **Methods**:
  - `submit(data_hash, station_id, timestamp, ipfs_cid)` — Oracle submits hashed reading
  - `verify(station_id, timestamp, claimed_hash)` — Anyone verifies a reading
- **Access Control**: Only authorized oracle address can submit
- **Storage**: Global state for latest + Box storage for per-station history
- **AERO Reward**: Oracle earns 1 AERO per verified submission

---

## Feature 2: GreenProof NFTs — Verifiable Proof-of-Action

### Problem Deep-Dive
- User places a tree on the Cesium map and sees "22 kg CO₂/year offset" — but did they actually plant a tree?
- The "Get Quote" button fires and forgets — no proof of any real-world action
- Carbon offset claims from platforms like this are often criticized as greenwashing
- No way for a third party (investor, regulator, buyer) to verify any environmental claim

### Solution: Proof-of-Action NFTs

When a user takes a real green action (plants a tree, installs solar, sets up water harvesting), they submit **geotagged photo evidence**. A verifier approves it, and an **immutable NFT** is minted with all proof embedded.

### Complete Workflow

```
Step 1: User Takes Real-World Action
├── User plants a tree / installs solar panel / sets up rainwater system
├── Opens AERO-EARTH app and taps "Claim GreenProof"
└── Selects action type: tree_planted | solar_installed | water_harvested | garden_installed | purifier_placed

Step 2: Evidence Capture
├── App captures photo from camera (required)
├── GPS coordinates auto-captured (high-accuracy, required)
├── Timestamp auto-captured (device + server time)
├── User can add optional notes/description
└── All evidence bundled into a proof package

Step 3: Upload to IPFS
├── Photo uploaded to IPFS via Pinata → photo_cid
├── Proof metadata JSON uploaded to IPFS → metadata_cid
│   ├── action_type, timestamp, GPS lat/lon/accuracy
│   ├── photo_cid reference
│   ├── device fingerprint
│   └── user's Algorand address
└── metadata_cid becomes the NFT's URL

Step 4: Submit Proof Request (On-Chain)
├── User connects Pera Wallet
├── User opts into GreenProof smart contract (one-time)
├── App calls contract method: request(action_type, metadata_cid, co2_grams, geo_hash)
├── User's local state updated: status = "pending", pending_ipfs = metadata_cid
├── User stakes small amount of AERO tokens as commitment
└── Transaction signed via Pera Wallet

Step 5: Verification
├── Verifier (trusted address or community DAO) reviews:
│   ├── Downloads photo from IPFS — does it show a real tree/panel?
│   ├── Checks GPS coordinates — is it a real location?
│   ├── Checks timestamp — is it recent and consistent?
│   └── Cross-references with satellite imagery (future: automated)
├── If approved: verifier calls approve(user_address)
└── If rejected: verifier calls reject(user_address) with reason

Step 6: NFT Minting (Automatic on Approval)
├── Smart contract executes Inner Transaction:
│   ├── Creates new ASA with total=1, decimals=0 (unique NFT)
│   ├── Unit name: "GPROOF"
│   ├── Asset name: "GreenProof-tree_planted" (dynamic)
│   ├── URL: "ipfs://{metadata_cid}" (immutable proof link)
│   └── Manager/Reserve/Freeze/Clawback all set to ZERO address (fully immutable)
├── NFT transferred to user's wallet
├── User's local state: status = "verified", nft_asa_id = {new ASA ID}
└── Global counters updated: total_proofs++, total_co2 += co2_amount

Step 7: User Receives Rewards
├── GreenProof verified → triggers AERO Rewards contract
├── AERO tokens distributed based on action type:
│   ├── Tree planted: 50 AERO
│   ├── Solar installed: 100 AERO
│   ├── Water harvesting: 75 AERO
│   ├── Vertical garden: 60 AERO
│   └── Air purifier: 30 AERO
├── Stake refunded to user
├── Green Score increased
└── User's rank on leaderboard updated

Step 8: Public Verification
├── Anyone can look up the NFT on Pera Explorer
├── Click the IPFS URL to see photo + GPS + timestamp
├── Verify the NFT was minted by the official GreenProof contract
├── Check that manager address is ZERO (can never be modified)
└── Full chain of custody: user request → verifier approval → NFT mint
```

### Tools Used
- **PyTeal** → GreenProof stateful contract with Inner Transactions for ASA minting
- **ASA (Algorand Standard Assets)** → Each GreenProof is a unique NFT (total=1, decimals=0)
- **Inner Transactions** → Contract autonomously creates NFT on verification approval
- **JS SDK + Pera Wallet** → User connects wallet, signs proof request transaction
- **IPFS (Pinata)** → Store photos and metadata permanently off-chain
- **Pera Explorer** → Public NFT verification page
- **Lora** → Test NFT minting flow on LocalNet
- **AlgoKit CLI** → Deploy and manage contract lifecycle

### Smart Contract: GreenProof Manager
- **Type**: Stateful Application (PyTeal) with Inner Transactions
- **Methods**:
  - `request(action_type, ipfs_cid, co2_grams, geo_hash)` — User submits proof
  - `approve(user_address)` — Verifier approves and triggers NFT mint
  - `reject(user_address)` — Verifier rejects with reason
- **Inner Txn**: AssetConfigTxn creating a new ASA NFT with immutable metadata
- **Access Control**: Only designated verifier can approve/reject

---

## Feature 3: Smart Contract Commitments — "Get Quote" Accountability

### Problem Deep-Dive
- User clicks "Get Quote" for solar panels → vendor gets lead → nothing happens
- No tracking of whether the user followed through
- No consequence for abandoning green commitments
- Vendors can't trust that leads are serious

### Solution: Stake-Based Commitment Escrow

When a user clicks "Get Quote", they lock a **micro-stake** (0.5 ALGO or equivalent AERO tokens) in a smart contract. If they complete the action (verified), they get the stake back + bonus AERO. If they abandon it after 30 days, the stake goes to a **community green fund**.

### Complete Workflow

```
Step 1: User Clicks "Get Quote"
├── Current behavior: quote form appears → that's it
├── New behavior: before quote is submitted, a commitment dialog appears
├── Dialog explains: "Lock 0.5 ALGO to show you're serious. Get it back + bonus when you complete the action."
└── User chooses to commit or skip (skip = traditional non-tracked quote)

Step 2: Create Commitment (Atomic Transaction)
├── Two transactions grouped atomically:
│   ├── Transaction 1: Application Call to Commitment Escrow contract
│   │   └── Args: commit, action_type ("solar_installation"), quote_id
│   └── Transaction 2: Payment of 0.5 ALGO to contract's escrow address
├── Both signed together via Pera Wallet (atomic = both succeed or both fail)
├── Contract stores in user's local state:
│   ├── action_type, quote_id, stake_amount
│   ├── commit_timestamp, deadline (commit_ts + 30 days)
│   └── status = "active"
└── Global counter: commitment_count++

Step 3: Vendor Receives Verified Lead
├── Vendor dashboard shows this lead has a blockchain commitment
├── Commitment ID links to Pera Explorer — vendor can verify the stake
├── Vendor knows this is a serious lead (user put money down)
└── Higher conversion rate for vendors = better service for users

Step 4a: User Completes Action → REFUND + BONUS
├── User completes solar installation / tree planting / etc.
├── Submits GreenProof (Feature 2) or vendor confirms completion
├── Verifier calls: verify_completion(user_address)
├── Smart contract executes Inner Transaction:
│   └── Payment: sends stake_amount back to user
├── Status updated: "completed"
├── AERO bonus distributed: 25 AERO for completing commitment
└── Green Score increased

Step 4b: User Abandons → STAKE TO GREEN FUND
├── 30-day deadline passes without verification
├── Anyone can call: claim_expired(user_address)
│   └── (This is permissionless — a bot or community member can trigger it)
├── Smart contract executes Inner Transaction:
│   └── Payment: sends stake_amount to green_fund_address
├── Green fund accumulates community pool for environmental projects
├── Status updated: "expired"
└── User's Green Score slightly decreased

Step 5: Community Green Fund Usage
├── Green fund managed by DAO (Feature 6 - see Bonus)
├── Community votes on how to spend accumulated stakes
├── Examples: plant trees in a park, fund solar for a school, clean water project
└── All spending tracked on-chain via DAO proposals
```

### Tools Used
- **PyTeal** → Commitment Escrow stateful contract with Inner Transactions
- **Atomic Transfers** → Group app call + payment into single atomic operation
- **Inner Transactions** → Contract sends refund or forwards to green fund
- **JS SDK + Pera Wallet** → User signs atomic group transaction
- **Lora** → Test escrow flows: commit → verify → refund / commit → expire → fund
- **Pera Explorer** → Public verification that commitment exists and stake is locked
- **AlgoKit CLI** → Deploy, fund contract with minimum balance

### Smart Contract: Commitment Escrow
- **Type**: Stateful Application (PyTeal) with escrow
- **Methods**:
  - `commit(action_type, quote_id)` — Atomic with payment, creates commitment
  - `verify(user_address)` — Verifier confirms completion, triggers refund
  - `expire(user_address)` — Anyone triggers after deadline, stake → green fund
- **Access Control**: commit = any user, verify = authorized verifier, expire = permissionless (time-gated)
- **Minimum Balance**: Contract address needs ALGO to hold escrow funds

---

## Feature 4: AERO Token — Green Action Rewards

### Problem Deep-Dive
- The app shows beautiful environmental impact data but there's zero incentive
- Users see "if you plant a tree, AQI improves by 5 points" — so what?
- No reward, no gamification, no economy around taking action
- Competitors (carbon credit platforms) have tokens but they're disconnected from real actions

### Solution: AERO Token Economy

AERO is an **Algorand Standard Asset (ASA)** — a fungible token that users earn for verified green actions and spend on platform features.

### Token Economics

```
AERO Token Distribution
━━━━━━━━━━━━━━━━━━━━━━━
Total Supply: 100,000,000 AERO (fixed, no more can be created)

┌────────────────────┬──────────┬──────────────────────────────────┐
│ Allocation         │ Amount   │ Purpose                          │
├────────────────────┼──────────┼──────────────────────────────────┤
│ Rewards Pool       │ 40M (40%)│ Distributed to users for actions │
│ Community Green Fund│ 25M (25%)│ DAO-governed environmental fund  │
│ Development        │ 20M (20%)│ Team, infra, partnerships        │
│ Ecosystem Growth   │ 15M (15%)│ Partnerships, grants, liquidity  │
└────────────────────┴──────────┴──────────────────────────────────┘
```

### Earn & Spend Flows

```
EARNING AERO (Verified Actions Only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── 🌳 Plant a tree (GreenProof verified)      → 50 AERO
├── ☀️ Complete solar installation (verified)   → 100 AERO
├── 💧 Set up water harvesting (verified)       → 75 AERO
├── 🌿 Install vertical garden (verified)       → 60 AERO
├── 💨 Place air purifier (verified)            → 30 AERO
├── ✅ Complete a commitment (Feature 3)        → 25 AERO
├── 📊 Report verified AQI data (oracle)        → 1 AERO per reading
├── 📅 Daily check-in (rate-limited, 24h)       → 1 AERO
├── 👥 Refer a friend who takes action           → 10 AERO
└── 🐦 Share impact on social media              → 5 AERO

SPENDING AERO
━━━━━━━━━━━━━
├── 📈 Premium AQI alerts (push notifications)  → 50 AERO/month
├── 📄 Detailed environmental reports (PDF)     → 25 AERO
├── 🏪 Green marketplace purchases              → Variable
├── 📜 Carbon offset certificates (printable)   → 100 AERO
├── 🗳️ DAO voting power (governance)             → Stake AERO
├── 🎨 GreenProof NFT minting fee               → 5 AERO
└── ⚡ Priority vendor matching                  → 20 AERO
```

### Complete Workflow

```
Step 1: AERO Token Creation (One-Time)
├── Admin creates ASA via Python SDK:
│   ├── Total: 100,000,000,000,000 (100M × 10^6 for 6 decimal places)
│   ├── Decimals: 6
│   ├── Unit Name: "AERO"
│   ├── Asset Name: "AERO Green Token"
│   ├── URL: "https://aero-earth.io/token"
│   └── Manager/Reserve/Freeze/Clawback: Creator address (for distribution)
├── 40M AERO transferred to Rewards Contract address
├── 25M AERO transferred to Green Fund address
└── ASA ID recorded in deployment config

Step 2: User Opt-In
├── User connects Pera Wallet
├── App checks if user has opted into AERO ASA
├── If not: prompts user to send opt-in transaction (0 ALGO asset transfer to self)
├── User signs via Pera Wallet
└── User can now receive AERO tokens

Step 3: Earning AERO (Triggered by Other Features)
├── GreenProof verified (Feature 2) → AERO Rewards contract called
├── Commitment completed (Feature 3) → AERO Rewards contract called
├── AQI data reported (Feature 1) → AERO Rewards contract called
├── Rewards contract executes Inner Transaction:
│   └── Asset Transfer: AERO tokens from Rewards Pool → User's wallet
├── User's local state updated:
│   ├── total_earned += reward_amount
│   ├── last_reward_timestamp = now
│   └── action_count++
└── Global state: total_distributed += reward_amount

Step 4: Daily Check-In (Rate-Limited)
├── User opens app and clicks "Daily Check-In"
├── Contract checks: last_checkin timestamp > 24 hours ago
├── If yes: sends 1 AERO + increments checkin_streak
├── If no: rejects (prevents abuse)
└── Streak bonuses: 7-day streak = 2× reward, 30-day = 5×

Step 5: Spending AERO
├── User navigates to "Green Store" or feature that costs AERO
├── App builds ASA transfer transaction: user → platform wallet
├── User signs via Pera Wallet
├── Feature unlocked upon transaction confirmation
└── All spending tracked on-chain for transparency

Step 6: Balance Display
├── Frontend fetches user's AERO balance via JS SDK:
│   └── algodClient.accountInformation(address) → find AERO ASA in assets
├── Displayed in wallet widget on every page
├── Historical transactions shown in "My AERO" dashboard
└── Links to Pera Explorer for full transaction history
```

### Tools Used
- **ASA (Algorand Standard Asset)** → AERO token creation (fungible, decimals=6)
- **PyTeal** → AERO Rewards stateful contract with rate-limiting and Inner Transactions
- **Inner Transactions** → Contract distributes AERO to users without admin signing each one
- **JS SDK** → Frontend balance queries, opt-in transactions, spending transactions
- **Pera Wallet** → User signs all AERO-related transactions
- **Algorand Metrics Dashboard** → Track total supply, distribution rate, holder count
- **AlgoKit CLI** → Deploy Rewards contract, fund with AERO tokens

### Smart Contract: AERO Rewards
- **Type**: Stateful Application (PyTeal)
- **Methods**:
  - `reward(user_address, action_type)` — Admin/contract distributes reward
  - `checkin()` — User claims daily check-in (rate-limited)
- **Inner Txn**: ASA Transfer from contract's holding to user
- **Anti-Abuse**: 24h cooldown on check-in, action-specific rate limits
- **Prerequisite**: Contract must hold AERO tokens (funded from Rewards Pool allocation)

---

## Feature 5: On-Chain Calculation Proofs — Auditable Savings Claims

### Problem Deep-Dive
- Solar page says "You'll save ₹25,000/year" — based on what formula? What inputs?
- Water page says "You'll save 50,000 liters/year" — who verified that?
- Vendors could inflate numbers to make sales
- Regulators can't audit claims across the platform
- Users comparing quotes have no way to know if numbers are consistent

### Solution: Hash Inputs + Outputs On-Chain

Every time a calculation runs (solar savings, water savings, carbon offset), the **exact inputs, formula version, and outputs** are hashed and stored on-chain. Anyone can re-run the same calculation with the same inputs and verify they get the same hash.

### Complete Workflow

```
Step 1: User Triggers Calculation
├── User clicks on a building in Solar Page
├── Inputs captured:
│   ├── Roof area (m²) — from Cesium 3D tileset click
│   ├── Location (lat, lon) — from map
│   ├── Average sun hours — from weather API
│   ├── Electricity tariff (₹/kWh) — user input
│   ├── Shadow coverage (%) — from shadow analysis
│   └── Panel type/efficiency — user selection
└── Calculation engine runs with these inputs

Step 2: Deterministic Calculation
├── All formulas are versioned (e.g., "v1.0.0")
├── Same inputs ALWAYS produce same outputs (no random, no floating point variance)
├── Outputs:
│   ├── System size (kW)
│   ├── Annual output (kWh)
│   ├── Annual savings (₹)
│   ├── CO₂ avoided (kg/year)
│   ├── Installation cost (₹)
│   └── Payback period (years)
└── Formula version tagged to every output

Step 3: Hash & Store Proof
├── Inputs → deterministic JSON → SHA-256 → input_hash
├── Outputs → deterministic JSON → SHA-256 → output_hash
├── Full data (inputs + outputs + formula) uploaded to IPFS → data_cid
├── Backend calls Calculation Proof contract:
│   └── store(calc_type, input_hash, output_hash, formula_version, ipfs_cid)
├── Contract stores proof with unique proof_id
└── proof_id returned to frontend

Step 4: Display Verification Badge
├── Solar/Water results page shows "🔗 Calculation Verified On-Chain"
├── Badge shows:
│   ├── Proof ID: #1234
│   ├── Formula: v1.0.0
│   ├── Input Hash: 0xab3f...
│   ├── Output Hash: 0x7c2d...
│   └── Link to Pera Explorer
└── User can share this verified calculation with vendors

Step 5: Third-Party Verification
├── Auditor/vendor/regulator wants to verify a savings claim
├── They download full data from IPFS using the CID
├── They re-run the calculation using the disclosed formula (open source)
├── They hash their inputs and outputs
├── They compare their hashes with on-chain hashes:
│   ├── input_hash matches? → Inputs weren't tampered with ✓
│   ├── output_hash matches? → Outputs are correct for those inputs ✓
│   └── Both match? → Calculation is verified and trustworthy ✓
└── This works even years later — on-chain data is permanent

Step 6: Formula Updates
├── When calculation formulas are improved:
│   ├── New version created: "v1.1.0"
│   ├── Admin calls: update_formula("v1.1.0")
│   ├── Old proofs remain valid with their original version
│   └── New calculations use new version
├── Users can see "Calculated with Formula v1.0.0" vs "v1.1.0"
└── Full changelog of formula versions maintained
```

### Applies To All Three Pages

| Page | Calculation Inputs | Calculation Outputs |
|---|---|---|
| **Solar** | Roof area, sun hours, tariff, shadow, panel type, location | System size, annual kWh, annual savings, CO₂ avoided, payback |
| **Water** | Building dimensions, rainfall, catchment area, water price, location | Annual collection (liters), annual savings, tank size needed |
| **AQI** | Current AQI, PM2.5, tree type, garden area, purifier specs | AQI improvement, PM2.5 reduction, CO₂ offset, cost estimate |

### Tools Used
- **PyTeal** → Calculation Proof stateful contract
- **Python SDK** → Backend service hashes and submits proofs
- **Box Storage** → Store proof history (potentially thousands of proofs)
- **IPFS (Pinata)** → Store full calculation data permanently
- **JS SDK** → Frontend queries proof data for verification badges
- **Pera Explorer** → Public audit link for any calculation proof
- **Lora** → Test proof storage and verification during development

### Smart Contract: Calculation Proof
- **Type**: Stateful Application (PyTeal)
- **Methods**:
  - `store(calc_type, input_hash, output_hash, formula_version, ipfs_cid)` — Store proof
  - `verify(proof_id, claimed_input_hash, claimed_output_hash)` — Verify proof
  - `update_formula(new_version)` — Admin updates formula version
  - `authorize(calculator_address)` — Admin authorizes new calculators
- **Access Control**: Only authorized calculators can store, anyone can verify

---

## Development & Deployment Pipeline

### Phase 1: Local Development (Week 1-2)

```
1. Install AlgoKit CLI
   └── winget install algorand.algokit

2. Initialize contract project
   └── algokit init --name aero-contracts --template python

3. Start local Algorand sandbox
   └── algokit localnet start

4. Open Lora for visual testing
   └── algokit localnet explore

5. Write all 5 contracts in PyTeal
   ├── contracts/aqi_oracle.py
   ├── contracts/greenproof_nft.py
   ├── contracts/commitment_escrow.py
   ├── contracts/aero_token.py
   └── contracts/calculation_proof.py

6. Compile to TEAL
   └── python contracts/{each_contract}.py → produces .teal files

7. Deploy to LocalNet
   └── python scripts/deploy_all.py --network localnet

8. Test all flows using Lora
   ├── Submit AQI reading → verify on-chain hash
   ├── Request GreenProof → approve → check NFT in wallet
   ├── Create commitment → verify → check refund
   ├── Trigger AERO reward → check balance
   └── Store calculation proof → verify with different hash → should fail
```

### Phase 2: TestNet Deployment (Week 3-4)

```
1. Get TestNet ALGO from faucet
   └── https://bank.testnet.algorand.network/

2. Deploy all contracts to TestNet
   └── python scripts/deploy_all.py --network testnet

3. Record all App IDs in .env file
   ├── REACT_APP_AQI_ORACLE_APP_ID=
   ├── REACT_APP_GREENPROOF_APP_ID=
   ├── REACT_APP_COMMITMENT_APP_ID=
   ├── REACT_APP_AERO_REWARDS_APP_ID=
   ├── REACT_APP_CALC_PROOF_APP_ID=
   └── REACT_APP_AERO_ASA_ID=

4. Integrate frontend React components
   ├── AlgorandContext (wallet + SDK provider)
   ├── WalletConnect button (Pera Wallet)
   ├── VerifiedAQIBadge component
   ├── GreenProofMint flow
   ├── CommitmentCard with stake UI
   ├── AEROBalance widget
   └── CalculationVerify badge

5. Test with Pera Wallet (TestNet mode)
   └── Full end-to-end user flow
```

### Phase 3: MainNet Launch (Week 5+)

```
1. Security audit of all 5 contracts
2. Deploy to MainNet
   └── python scripts/deploy_all.py --network mainnet
3. Fund AERO Rewards contract with token allocation
4. Set up backend oracle cron job (30-min AQI updates)
5. Configure IPFS pinning (Pinata paid plan for permanence)
6. Launch with feature flags (gradual rollout)
7. Monitor via Algorand Metrics Dashboard + Dappflow
```

---

## Project File Structure

```
aero-earth/
├── contracts/                          # Smart Contracts (PyTeal)
│   ├── aqi_oracle.py                   # Feature 1: AQI Data Oracle
│   ├── greenproof_nft.py               # Feature 2: GreenProof NFTs
│   ├── commitment_escrow.py            # Feature 3: Commitment Escrow
│   ├── aero_token.py                   # Feature 4: AERO Rewards
│   ├── calculation_proof.py            # Feature 5: Calculation Proofs
│   ├── aqi_oracle_approval.teal        # Compiled TEAL output
│   ├── aqi_oracle_clear.teal
│   ├── greenproof_approval.teal
│   ├── greenproof_clear.teal
│   ├── commitment_approval.teal
│   ├── commitment_clear.teal
│   ├── aero_rewards_approval.teal
│   ├── aero_rewards_clear.teal
│   ├── calcproof_approval.teal
│   └── calcproof_clear.teal
│
├── scripts/                            # Deployment & Admin Scripts
│   ├── create_aero_token.py            # ASA token creation
│   └── deploy_all.py                   # Master deployment to any network
│
├── services/                           # Backend Services (Python)
│   ├── aqi_oracle_service.py           # Cron job: fetch AQI → hash → submit on-chain
│   └── calculation_proof_service.py    # Hash calculations → submit proofs
│
├── src/                                # Frontend (React + TypeScript)
│   ├── context/
│   │   └── AlgorandContext.jsx         # Wallet + blockchain state provider
│   ├── components/
│   │   ├── WalletConnect.jsx           # Pera Wallet connect/disconnect button
│   │   ├── VerifiedAQIBadge.jsx        # On-chain verification badge
│   │   ├── GreenProofMint.jsx          # Submit proof-of-action flow
│   │   ├── CommitmentCard.jsx          # Stake commitment UI
│   │   ├── AeroRewards.jsx             # Token balance + earn history
│   │   └── CalculationVerify.jsx       # Savings claim verification badge
│   └── services/
│       └── greenproof.js               # Frontend SDK wrapper for Algorand calls
│
├── deployments/                        # Deployment Records
│   ├── localnet_deployment.json        # LocalNet contract IDs
│   ├── testnet_deployment.json         # TestNet contract IDs
│   └── mainnet_deployment.json         # MainNet contract IDs
│
├── tests/                              # Contract Tests (Python)
│   ├── test_aqi_oracle.py
│   ├── test_greenproof.py
│   ├── test_commitment.py
│   ├── test_aero_token.py
│   └── test_calc_proof.py
│
└── .env                                # Contract IDs, API keys (not committed)
```

---

## Transaction Flow Summary

```
User Journey: Plant a Tree → Get Rewarded

1. [Frontend]  User places tree on Cesium map
2. [Frontend]  App calculates impact: -5 AQI, 22 kg CO₂/year, ₹800 cost
3. [Backend]   Calculation hashed & stored on-chain (Feature 5)    ← Proof #1
4. [Frontend]  User clicks "Get Quote" for professional planting
5. [Frontend]  User locks 0.5 ALGO commitment (Feature 3)          ← Proof #2
6. [Real World] User gets tree planted by vendor
7. [Frontend]  User takes photo, submits GreenProof (Feature 2)    ← Proof #3
8. [Backend]   Verifier approves → NFT minted to user
9. [Smart Cntrt] AERO reward: 50 AERO sent to user (Feature 4)
10. [Smart Cntrt] Commitment stake refunded + 25 bonus AERO
11. [Backend]  New AQI reading shows improvement → hashed (Feature 1) ← Proof #4
12. [Frontend] Dashboard: "You planted 1 tree. 4 blockchain proofs. 75 AERO earned."

Total on-chain proofs for ONE action: 4
├── Calculation proof (savings claim is auditable)
├── Commitment proof (user was financially accountable)
├── GreenProof NFT (tree actually exists, with photo + GPS)
└── AQI data proof (impact is measurable and verified)
```

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| **Fake GPS coordinates** | Cross-reference with satellite imagery API; require photo with metadata |
| **Recycled photos** | Perceptual hash check against existing proofs; require fresh EXIF data |
| **Oracle manipulation** | Multi-oracle system (future); community challenges with 3-strike unverification |
| **Sybil attacks (fake accounts)** | Minimum ALGO balance requirement; increasing stake for repeat actions |
| **Smart contract bugs** | AlgoKit testing framework; third-party audit before MainNet |
| **AERO token inflation** | Fixed supply (100M); no mint function; distribution rate caps in contract |
| **IPFS data loss** | Multiple pinning services (Pinata + Infura); on-chain hash survives even if IPFS data lost |

---

## Summary: What Makes This Different

> This is **NOT** "we added blockchain because it's trendy."
> This is "we found **5 specific trust/accountability gaps** and blockchain is the **only technology** that solves them."

- **AQI Oracle**: You can't trust centralized databases with environmental data that affects policy decisions
- **GreenProof NFTs**: You can't trust self-reported carbon offsets — NFTs with photo+GPS+timestamp are proof
- **Commitment Escrow**: You can't trust "leads" without skin in the game — micro-stakes create accountability
- **AERO Tokens**: You can't motivate environmental action with "feel good" metrics — real tokens create real incentives
- **Calculation Proofs**: You can't trust savings claims from vendors who profit from inflating numbers — on-chain hashes create auditability

**Every feature solves a real problem. Nothing is blockchain for blockchain's sake.**
