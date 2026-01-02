<div align="center">

# 🔐 Wallet-OOPS Chain Agent

### *AI-Powered DCA Automation with MetaMask Advanced Permissions (ERC-7715)*

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Envio](https://img.shields.io/badge/Indexer-Envio-6366f1)](https://envio.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<img src="./docs/dashboard.png" alt="Dashboard Preview" width="800"/>

**🏆 Built for MetaMask Advanced Permissions Dev Cook-Off Hackathon**

[Live Demo](#-quick-start) • [Documentation](#-how-it-works) • [Contracts](#-contract-addresses-sepolia)

</div>

---

## 🎯 What is Wallet-OOPS Chain Agent?

**Wallet-OOPS Chain Agent** is a revolutionary **Dollar-Cost Averaging (DCA) automation platform** that leverages MetaMask's cutting-edge **Advanced Permissions system (ERC-7715)**. 

Grant a single, time-bound permission to our AI agents, and let them automatically buy ETH for you when prices dip — **no repeated approvals, no manual intervention!**

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **One-Time Permission** | Grant once, automate forever (within limits) |
| 🤖 **Agent-to-Agent Delegation** | CoordinatorAgent → ExecutionAgent pattern |
| 📉 **Smart Price Triggers** | Auto-buy when ETH drops by your target % |
| 📊 **Real-Time Tracking** | Envio-powered dashboard with live updates |
| 💰 **Safe & Controlled** | Daily limits, total caps, instant revocation |

---

## 🏗️ Architecture

```
┌─────────────┐    Permission    ┌──────────────────┐    Sub-Delegation    ┌─────────────────┐
│    User     │ ───────────────► │ CoordinatorAgent │ ─────────────────► │   ExecutionAgent    │
└─────────────┘     (ERC-7715)   └──────────────────┘                     └───────────────── ┘
      │                                  │                                         │
      │                                  │ Checks price oracle                     │ Executes swap
      │                                  ▼                                         ▼
      │                           ┌──────────────┐                         ┌───────────────┐
      │                           │ PriceOracle  │                         │   DEX/Uniswap │
      │                           └──────────────┘                         └───────────────┘
      │                                                                            │
      │◄────────────────────── ETH transferred back ───────────────────────────────┘
```

---

## 🔑 Advanced Permissions Usage

> **This section demonstrates our implementation of MetaMask's ERC-7715 Advanced Permissions**

### � Requesting Advanced Permissions

The user grants permission to the CoordinatorAgent through our frontend:

| Component | Link |
|-----------|------|
| **Frontend Hook** | [`useContracts.ts#L148-L174`](https://github.com/YashDave11/Chain-Agent/blob/main/frontend/src/hooks/useContracts.ts#L148-L174) |
| **Dashboard Grant UI** | [`page.tsx#L116-L160`](https://github.com/YashDave11/Chain-Agent/blob/main/frontend/src/app/dashboard/page.tsx#L116-L160) |
| **Smart Contract** | [`CoordinatorAgent.sol#L97-L128`](https://github.com/YashDave11/Chain-Agent/blob/main/contracts/src/CoordinatorAgent.sol#L97-L128) |

**Code Flow:**
```javascript
// Frontend: Grant permission call
const grantPermission = async ({ dailyAmount, duration, dipThreshold }) => {
  writeContract({
    address: COORDINATOR_AGENT,
    functionName: 'receivePermission',
    args: [token, dailyLimit, totalLimit, duration, targetDipBps]
  });
};
```

### 🔄 Redeeming/Revoking Advanced Permissions

Users can revoke their permissions at any time:

| Component | Link |
|-----------|------|
| **Revoke Function** | [`CoordinatorAgent.sol#L243-L253`](https://github.com/YashDave11/Chain-Agent/blob/main/contracts/src/CoordinatorAgent.sol#L243-L253) |
| **Sub-Delegation** | [`CoordinatorAgent.sol#L136-L155`](https://github.com/YashDave11/Chain-Agent/blob/main/contracts/src/CoordinatorAgent.sol#L136-L155) |

**Code Flow:**
```solidity
// Smart Contract: Revoke permission
function revokePermission(address user) external {
    require(msg.sender == user || msg.sender == owner, "Not authorized");
    permissions[user].active = false;
    delegations[user].active = false;
    emit PermissionRevoked(user);
}
```

---

## 📡 Envio Usage

> **We use [Envio HyperIndex](https://envio.dev/) for real-time blockchain event indexing**

### How We Use Envio

Envio powers our **real-time dashboard** by indexing all smart contract events:

1. **Permission Events** - Track when users grant/revoke permissions
2. **Delegation Events** - Monitor agent-to-agent sub-delegations  
3. **Execution Events** - Record all DCA buy transactions
4. **Price Updates** - Log oracle price changes

### 📂 Envio Code Links

| File | Description | Link |
|------|-------------|------|
| **Event Handlers** | Main indexer logic | [`EventHandlers.ts`](https://github.com/YashDave11/Chain-Agent/blob/main/indexer/src/EventHandlers.ts) |
| **GraphQL Schema** | Data models | [`schema.graphql`](https://github.com/YashDave11/Chain-Agent/blob/main/indexer/schema.graphql) |
| **Config** | Contract addresses & networks | [`config.yaml`](https://github.com/YashDave11/Chain-Agent/blob/main/indexer/config.yaml) |

### Indexed Events

```typescript
// Permission tracking (EventHandlers.ts#L45-L74)
CoordinatorAgentContract.PermissionReceived.handler(...)

// Delegation tracking (EventHandlers.ts#L76-L103)  
CoordinatorAgentContract.SubDelegationIssued.handler(...)

// Execution tracking (EventHandlers.ts#L105-L156)
CoordinatorAgentContract.ExecutionTriggered.handler(...)

// Swap tracking (EventHandlers.ts#L178-L217)
ExecutionAgentContract.SwapExecuted.handler(...)
```

---

## 💬 Feedback

> **Issues and suggestions for MetaMask Advanced Permissions**

We discovered the following during development:

1. **Documentation Gaps**: More examples for agent-to-agent delegation patterns would be helpful
2. **Testing Tools**: A testnet-compatible permission granting mock would speed up development
3. **TypeScript SDK**: Type definitions for permission structures would improve DX

*We will open GitHub issues for detailed feedback if applying for the Feedback track.*

---

## �🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask Flask (for Advanced Permissions)
- Sepolia testnet ETH

### Installation

```bash
# Clone the repository
git clone https://github.com/YashDave11/Chain-Agent.git
cd Chain-Agent

# Install frontend dependencies
cd frontend
npm install
npm run dev

# In another terminal, set up contracts
cd ../contracts
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your keys:

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
wallet-oops-chain-agent/
├── 📁 frontend/           # Next.js 14 dashboard
│   ├── src/
│   │   ├── app/           # Pages and layouts
│   │   ├── lib/           # wagmi config, ABIs
│   │   ├── hooks/         # Contract interaction hooks
│   │   └── components/    # UI components
│   └── package.json
│
├── 📁 contracts/          # Solidity smart contracts
│   ├── src/
│   │   ├── MockPriceOracle.sol
│   │   ├── CoordinatorAgent.sol
│   │   └── ExecutionAgent.sol
│   ├── script/
│   │   ├── deploy.cjs
│   │   └── demo.cjs
│   └── hardhat.config.cjs
│
├── 📁 indexer/            # Envio event indexer
│   ├── config.yaml
│   ├── schema.graphql
│   └── src/
│       └── EventHandlers.ts
│
└── 📄 README.md
```

---

## 🔧 Contract Addresses (Sepolia)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| MockPriceOracle | `0x11aa01e0d27FD26aed1d7A82A4c25433ee9de3AA` | [View](https://sepolia.etherscan.io/address/0x11aa01e0d27FD26aed1d7A82A4c25433ee9de3AA) |
| CoordinatorAgent | `0x7B3227C2337672EEbEd0fe0616Ecd3796c6a6F1De` | [View](https://sepolia.etherscan.io/address/0x7B3227C2337672EEbEd0fe0616Ecd3796c6a6F1De) |
| ExecutionAgent | `0x594bD38FC2d9b9bdEaD9B3D24e29f0B0F1E0BB87` | [View](https://sepolia.etherscan.io/address/0x594bD38FC2d9b9bdEaD9B3D24e29f0B0F1E0BB87) |

---

## 🎬 Demo Script

```bash
cd contracts

# Check current ETH price
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- price

# Trigger a 5% price dip  
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- dip 5

# Run full demo flow
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- demo
```

---

## 🏆 Hackathon Submission

### Track: MetaMask Advanced Permissions (ERC-7715) Dev Cook-Off

### 🌟 Key Innovations

1. **🤖 Agent-to-Agent Delegation** - Demonstrates 2-layer permission delegation pattern
2. **📈 Conditional Execution** - Price-based triggers without user intervention
3. **📊 Full Event Indexing** - Envio-powered GraphQL API for real-time updates
4. **✨ Production-Ready UX** - Beautiful glassmorphism dashboard

### 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, wagmi, viem, Framer Motion |
| Smart Contracts | Solidity 0.8.24, Hardhat |
| Indexing | Envio HyperIndex |
| Blockchain | Ethereum Sepolia Testnet |

---

## 🤝 Team

<div align="center">

**Built with ❤️ for the MetaMask Advanced Permissions Dev Cook-Off**

*Hackathon Submission - January 2026*

</div>

---

## � License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

### 🔗 Links

[🌐 Live Demo](http://localhost:3000) • [📜 Contracts](https://sepolia.etherscan.io/address/0x7B3227C2337672EEbEd0fe0616Ecd3796c6a6F1De) • [📊 Envio Dashboard](http://localhost:8080) • [📂 GitHub](https://github.com/YashDave11/Chain-Agent)

</div>
