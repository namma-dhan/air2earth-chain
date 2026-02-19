
<h2 align="center">
  <img src="ascii-art-text.png" alt="AeroEarth Header" width="700"/>
</h2>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=28&pause=800&color=27AE60&center=true&vCenter=true&width=800&lines=AeroEarth+%E2%80%94+Climate+%C3%97+Blockchain;3D+Earth+%7C+Green+Actions+%7C+On-Chain+Truth;Sustainable+Web3+Platform" alt="Typing SVG" />
</p>


<p align="center">
  <img src="https://img.shields.io/badge/blockchain-algorand-black.svg?style=flat-square&logo=algorand&logoColor=white" />
  <img src="https://img.shields.io/badge/avm-smart_contracts-blue.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/typescript-puyats-3178C6.svg?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/frontend-next.js_15-black.svg?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/ui-react-61DAFB.svg?style=flat-square&logo=react&logoColor=black" />


  <img src="https://img.shields.io/badge/3d-cesiumjs-00B3A4.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/styling-tailwindcss-38BDF8.svg?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/tooling-algokit-purple.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/explorer-lora-orange.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/backend-next.js_api_routes-black.svg?style=flat-square&logo=vercel" />
</p>

## ✨ Demo

`AeroChain` Decentralized platform that connects atmospheric intelligence with Earth-scale visualization using blockchain:

<p align="center">
  <img width="700" align="center" src="" alt="demo"/>
</p>


<p align="center">
  <img src="image1.png" width="300" alt="image1"/>
  <img src="image2.png" width="300" alt="image2"/>
</p>

<p align="center">
  <img src="image3.png" width="600" alt="image3"/>
</p>


**AeroEarth** is where environmental action meets blockchain truth. It’s a 3D digital twin of our planet that lets you visualize live air quality (AQI) data and take verifiable climate action. 

Instead of just looking at stats, users can interact with the 3D globe to "plant" virtual trees or add green infrastructure. When you do, the platform calculates the real-world CO₂ offset and securely logs this action on the Algorand blockchain, instantly awarding you unchangeable, cryptographically verifiable "Green Points".

## 🎯 The Problem We're Solving
Right now, climate action suffers from two massive problems: **lack of transparency** and **lack of engagement**. 

People and companies claim to plant trees or reduce emissions, but how do we *prove* it? And for the everyday user, environmental dashboards are just boring spreadsheets. 

AeroEarth fixes both:
1. **Gamified Action:** We turn climate awareness into an immersive 3D experience using CesiumJS.
2. **Absolute Proof:** By storing both the starting pollution data and the user's mitigation actions (carbon offsets) on-chain, we create a transparent, tamper-proof record of who is actually helping the planet.

## ⚡ Why We Chose Algorand
When building a global environmental platform, the blockchain itself needs to be green. We chose Algorand because:
- **Carbon Negative & Fast:** Algorand is fundamentally built to be environmentally friendly (carbon negative) with sub-3-second finality. It makes zero sense to build an eco-saving dApp on an energy-hungry Proof-of-Work chain.
- **Cheap Transactions:** Logging thousands of environmental data points and user actions requires micro-transaction fees. Algorand’s ~0.001 ALGO fee makes this economically viable.
- **Box Storage (`BoxMap`):** We heavily utilize Algorand's Box Storage. It allows us to store unlimited map data and user profiles on-chain with O(1) read access, bypassing the need for a centralized database entirely.
- **Algorand TypeScript (PuyaTs):** We wrote our smart contracts purely in TypeScript. The seamless DX of compiling familiar TS directly into AVM bytecode via AlgoKit was a game-changer for our development speed.

---

## 🔗 Live Links & Demo
- **Live Demo URL:** [Insert Vercel/Netlify Link Here]
- **Pitch / Demo Video:** [Insert LinkedIn Post URL Here]

---

## 🏗 Architecture & Smart Contracts

AeroEarth relies on two core smart contracts acting in harmony. Both are written in **Algorand TypeScript** (`@algorandfoundation/algorand-typescript`) and deployed via AlgoKit.

### 1. The AQI Registry Contract 
*Our decentralized oracle for live pollution data.*
- **What it does:** Stores real-time station data (AQI, PM2.5, coordinates) sourced from hardware sensors.
- **How it works:** Uses Algorand `BoxMap` for scalable, instant public reads. Our frontend fetches this data directly from the Algorand node—no Web2 database required.
- **Testnet App ID:** `[Insert Testnet App ID]` *(LocalNet: 1415)*
- **Verify on Lora Explorer:** [Insert Lora Link]

### 2. The Green Rewards Contract
*Our gamified, un-cheat-able carbon ledger.*
- **What it does:** Whenever a user places a tree on the 3D globe, our backend verifies the coordinates and calls this contract to mint "Green Points". 
- **How it works:** Maintains a global counter (`totalPointsIssued`) and per-user balances using a `BoxMap` (`pts:<user_address>`). Your eco-impact is fully verifiable by anyone.
- **Testnet App ID:** `[Insert Testnet App ID]` *(LocalNet: 1395)*
- **Verify on Lora Explorer:** [Insert Lora Link]

---

## 🛠 Tech Stack
- **Blockchain:** Algorand (AVM), Algorand TypeScript, PuyaTs
- **Developer Tooling:** AlgoKit, Lora Explorer, `@algorandfoundation/algokit-utils`
- **Frontend Engine:** Next.js 15, React, CesiumJS (3D Globe)
- **Styling:** TailwindCSS
- **Backend:** Next.js API Routes (Server-side proxy for signing admin transactions)

---

## 💻 Installation & Local Setup

Want to run AeroEarth yourself? Here’s how:

### 1. Prerequisites
- Node.js (v18+)
- Docker Desktop (required to run the local blockchain)
- [AlgoKit CLI](https://developer.algorand.org/docs/get-started/algokit/) 

### 2. Spin up the Blockchain
```bash
# Start your local Algorand node
algokit localnet start
```

### 3. Deploy the Smart Contracts
```bash
git clone [repo-url]
cd [repo-directory]/blockchain

# Deploy the AQI Registry & seed the initial map data
npm install
npm run reset       

# Deploy the Green Rewards ledger
cd green-rewards
npm install
npm run deploy      
```

### 4. Boot the 3D Frontend
```bash
cd ../air2earth-chain

# Set up your environment variables
cp .env.example .env.local 

# Install and run
npm install
npm run dev
```
Open up `http://localhost:3000` and start saving the planet!

---

## 📸 How to Use AeroEarth

### 1. Explore the 3D Pollution Heatmap
Spin the globe to view real-time pollution data. The heatmap is rendered dynamically based entirely on data fetched live from our AQI Registry Contract.
<div align="center">
  <!-- TODO: Drop screenshot here -->
  <img src="./public/screenshot-heatmap.png" alt="Heatmap Screenshot" width="800" />
</div>

### 2. Take Climate Action
Select the "Tree" tool from the left menu and place it anywhere on the map. The panel calculates the estimated CO₂ impact of your placement.
<div align="center">
  <!-- TODO: Drop screenshot here -->
  <img src="./public/screenshot-placement.png" alt="Tree Placement Screenshot" width="800" />
</div>

### 3. Earn Verifiable Green Rewards
The moment you plant a tree, a transaction is cemented on Algorand. The live "Green Rewards" panel on your screen automatically pulls your new, tamper-proof balance directly from the chain.
<div align="center">
  <!-- TODO: Drop screenshot here -->
  <img src="./public/screenshot-rewards.png" alt="Rewards Panel Screenshot" width="800" />
</div>

---

## ⚠️ Known Limitations & Future Roadmap
- **Network Dependency:** The current repo is configured for LocalNet for easy judging/testing. To run on TestNet, update the `NEXT_PUBLIC_ALGOD_SERVER` in your `.env`.
- **Hardware Profile:** Rendering 3D maps and high-res heatmaps via Cesium is GPU-intensive. It might stutter on older laptops.
- **Roadmap - Web3 Wallets:** Right now, the system tracks sessions and proxy addresses. Next up is native Pera Wallet / Defly integration so users hold their Green Points directly in their own wallets.

---

## 🤝 The Team
- **[Your Name]** - Blockchain Architect & 3D Engineering (*[LinkedIn Profile Link]*)
- **[Member 2 Name]** - [Role] (*[LinkedIn Profile Link]*)
- **[Member 3 Name]** - [Role] (*[LinkedIn Profile Link]*)
