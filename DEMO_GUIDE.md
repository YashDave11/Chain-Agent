# 🎬 ChainAgent Live Demo Guide

Follow these steps to test the complete DCA automation flow.

---

## Prerequisites
- Frontend running at `http://localhost:3000`
- MetaMask Flask wallet with Sepolia ETH
- Terminal open to `contracts/` folder

---

## 🎬 Demo Flow

### Step 1: Connect Wallet (Frontend)
1. Open http://localhost:3000
2. Click **"Connect Wallet"** button
3. Select your MetaMask account
4. Ensure you're on **Sepolia Network**

### Step 2: Grant Permission (Frontend)
1. Configure DCA settings:
   - Daily Amount: **100 USDC**
   - Duration: **30 Days**
   - Dip Threshold: **5%**
2. Click **"Grant Permission & Start"**
3. Confirm transaction in MetaMask
4. Wait for **"Permission Active"** badge

### Step 3: Verify on Blockchain (Terminal)
```bash
cd contracts
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- permission
```
Expected: `✅ Permission ACTIVE`

### Step 4: Issue Delegation (Terminal)
```bash
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- delegate
```
Expected: `✅ Delegated 60 USDC/day`

### Step 5: Simulate Price Dip (Terminal)
```bash
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- dip 5
```
Expected: `📉 Price dip simulated!`

### Step 6: Execute Swap (Terminal)
```bash
npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- execute
```
Expected: `✅ Swap executed!`

### Step 7: Verify Result (Frontend)
1. Click refresh icon (↻) on "Live Status" card
2. **ETH Accumulated** should increase
3. **Spent Today** should show amount used

---

## 📹 Recording the Demo
For hackathon submission, record:
1. Frontend showing wallet connect
2. Permission granting transaction
3. Terminal running agent commands
4. Frontend updating with results

---

## 🆘 Troubleshooting
- **"No active permission"**: Wait for tx to confirm
- **"Not owner"**: You need to run delegate from contract owner account
- **Network error**: Check Alchemy RPC URL in .env
