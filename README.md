# ChainAgent 🤖⚡

> **AI-powered DCA Automation with MetaMask Advanced Permissions (ERC-7715)**

![ChainAgent Dashboard](./docs/dashboard.png)

## 🎯 What is ChainAgent?

ChainAgent is a **Dollar-Cost Averaging (DCA) automation platform** that leverages MetaMask's new Advanced Permissions system. Grant one permission, and let AI agents automatically buy ETH for you when prices dip - without repeated approvals!

### ✨ Key Features

- **🔐 One-Time Permission**: Grant a single, time-bound permission with daily limits
- **🤖 Agent-to-Agent Delegation**: CoordinatorAgent sub-delegates to ExecutionAgent
- **📉 Smart Price Triggers**: Automatically buys when ETH drops by your target %
- **📊 Real-Time Tracking**: View all activity via Envio-powered dashboard
- **💰 Safe & Controlled**: Daily limits, total caps, and instant revocation

---

## 🏗️ Architecture

```
┌─────────┐    Permission    ┌──────────────────┐    Sub-Delegation    ┌─────────────────┐
│   You   │ ───────────────► │ CoordinatorAgent │ ─────────────────► │ ExecutionAgent  │
└─────────┘                  └──────────────────┘                     └─────────────────┘
     │                              │                                         │
     │                              │ Checks price                            │ Executes swap
     │                              ▼                                         ▼
     │                       ┌──────────────┐                         ┌───────────────┐
     │                       │ PriceOracle  │                         │   Uniswap     │
     │                       └──────────────┘                         └───────────────┘
     │                                                                        │
     │◄───────────────────── ETH transferred back ────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask Flask (for Advanced Permissions)
- Sepolia testnet ETH

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/chainagent.git
cd chainagent

# Install frontend dependencies
cd frontend
npm install
npm run dev

# In another terminal, set up contracts
cd ../contracts
npm install
```

### Configuration

1. Copy `.env.example` to `.env` and fill in your keys:

```env
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key_for_deployment
```

### Deploy Contracts

```bash
cd contracts
npx hardhat run script/deploy.cjs --network sepolia --config hardhat.config.cjs
```

---

## 📦 Project Structure

```
chainagent/
├── frontend/          # Next.js dashboard
│   ├── src/
│   │   ├── app/       # Pages and layouts
│   │   ├── lib/       # wagmi config, ABIs
│   │   ├── hooks/     # Contract hooks
│   │   └── components/# UI components
│   └── package.json
│
├── contracts/         # Solidity smart contracts
│   ├── src/
│   │   ├── MockPriceOracle.sol
│   │   ├── CoordinatorAgent.sol
│   │   └── ExecutionAgent.sol
│   ├── script/
│   │   ├── deploy.cjs
│   │   └── demo.cjs   # Demo script
│   └── hardhat.config.cjs
│
├── indexer/           # Envio event indexer
│   ├── config.yaml
│   ├── schema.graphql
│   └── src/
│       └── EventHandlers.ts
│
└── README.md
```

---

## 🔧 Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| MockPriceOracle | `0x11aa01e0d27FD26aed1d7A82A4c25433ee9de3AA` |
| CoordinatorAgent | `0x7B3227C2337672EEbEd0fe0616Ecd3796c6a6F1De` |
| ExecutionAgent | `0x594bD38FC2d9b9bdEaD9B3D24e29f0B0F1E0BB87` |

---

## 🎬 Demo Script

Run the demo to see the full flow in action:

```bash
cd contracts

# Check current ETH price
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- price

# Trigger a 5% price dip
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- dip 5

# Run full demo (after granting permission via frontend)
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- demo
```

---

## 🏆 Hackathon Submission

### Track: MetaMask Advanced Permissions (ERC-7715) Dev Cook-Off

### Key Innovations

1. **Agent-to-Agent Delegation**: Demonstrates 2-layer permission delegation
2. **Conditional Execution**: Price-based triggers without user intervention
3. **Full Event Indexing**: Envio-powered GraphQL API for real-time updates
4. **Production-Ready UX**: Beautiful glassmorphism dashboard

### Tech Stack

- **Frontend**: Next.js 14, wagmi, viem, Framer Motion
- **Smart Contracts**: Solidity 0.8.24, Hardhat
- **Indexing**: Envio HyperIndex
- **Blockchain**: Ethereum Sepolia Testnet

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Team

Built with ❤️ for the MetaMask Advanced Permissions Dev Cook-Off

---

## 📞 Links

- [Live Demo](http://localhost:3000)
- [Contracts on Etherscan](https://sepolia.etherscan.io/address/0x7B3227C2337672EEbEd0fe0616Ecd3796c6a6F1De)
- [Envio Dashboard](http://localhost:8080)
