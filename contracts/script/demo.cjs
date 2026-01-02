// Demo Trigger Script for ChainAgent
// This script simulates the full DCA flow for demo purposes

const hre = require("hardhat");

// Contract addresses from deployment
const CONTRACTS = {
  mockPriceOracle: "0x11aa01e0d27FD26aed1d7A82A4c25433ee9de3AA",
  coordinatorAgent: "0x7B3227C2337672EEbEd0fe0616Ecd3796c6a6F1De",
  executionAgent: "0x594bD38FC2d9b9bdEaD9B3D24e29f0B0F1E0BB87",
};

const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

async function main() {
  console.log("🎬 ChainAgent Demo Script");
  console.log("=".repeat(50));

  const [owner] = await hre.ethers.getSigners();
  console.log("Using account:", owner.address);
  console.log("");

  // Get contract instances
  const MockPriceOracle = await hre.ethers.getContractAt(
    "MockPriceOracle",
    CONTRACTS.mockPriceOracle
  );
  const CoordinatorAgent = await hre.ethers.getContractAt(
    "CoordinatorAgent",
    CONTRACTS.coordinatorAgent
  );
  const ExecutionAgent = await hre.ethers.getContractAt(
    "ExecutionAgent",
    CONTRACTS.executionAgent
  );

  // Menu
  const action = process.argv[2];

  switch (action) {
    case "price":
      await showPrice(MockPriceOracle);
      break;
    case "dip":
      await triggerDip(MockPriceOracle, process.argv[3] || "5");
      break;
    case "permission":
      await checkPermission(CoordinatorAgent, owner.address);
      break;
    case "delegate":
      await issueDelegation(CoordinatorAgent, owner.address);
      break;
    case "execute":
      await triggerExecution(ExecutionAgent, owner.address);
      break;
    case "stats":
      await showStats(ExecutionAgent, owner.address);
      break;
    case "reset":
      await resetPrice(MockPriceOracle);
      break;
    case "demo":
      await fullDemo(MockPriceOracle, CoordinatorAgent, ExecutionAgent, owner.address);
      break;
    default:
      showHelp();
  }
}

function showHelp() {
  console.log("📖 Available Commands:");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- price");
  console.log("    → Show current ETH price from oracle");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- dip 5");
  console.log("    → Trigger a 5% price dip");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- permission");
  console.log("    → Check user's permission status");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- delegate");
  console.log("    → Issue sub-delegation to ExecutionAgent");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- execute");
  console.log("    → Trigger execution (swap)");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- stats");
  console.log("    → Show user's accumulated ETH and stats");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- reset");
  console.log("    → Reset price to $3000");
  console.log("");
  console.log("  npx hardhat run script/demo.cjs --network sepolia --config hardhat.config.cjs -- demo");
  console.log("    → Run full demo flow");
}

async function showPrice(oracle) {
  console.log("📊 Fetching current ETH price...");
  const price = await oracle.getPrice("0x0000000000000000000000000000000000000000");
  const priceFormatted = Number(price) / 1e8;
  console.log(`   Current ETH Price: $${priceFormatted.toLocaleString()}`);
}

async function triggerDip(oracle, percentStr) {
  const percent = parseInt(percentStr);
  const bps = percent * 100;
  
  console.log(`📉 Triggering ${percent}% price dip...`);
  
  const priceBefore = await oracle.getPrice("0x0000000000000000000000000000000000000000");
  console.log(`   Price before: $${(Number(priceBefore) / 1e8).toLocaleString()}`);
  
  const tx = await oracle.simulateDip("0x0000000000000000000000000000000000000000", bps);
  await tx.wait();
  
  const priceAfter = await oracle.getPrice("0x0000000000000000000000000000000000000000");
  console.log(`   Price after:  $${(Number(priceAfter) / 1e8).toLocaleString()}`);
  console.log(`   ✅ Price dip simulated!`);
  console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

async function resetPrice(oracle) {
  console.log("🔄 Resetting ETH price to $3000...");
  const tx = await oracle.updatePrice(
    "0x0000000000000000000000000000000000000000",
    3000n * 10n ** 8n
  );
  await tx.wait();
  console.log("   ✅ Price reset to $3000");
  console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

async function checkPermission(coordinator, userAddress) {
  console.log("🔍 Checking permission for", userAddress);
  
  const permission = await coordinator.getPermission(userAddress);
  
  if (permission.active) {
    console.log("   ✅ Permission ACTIVE");
    console.log(`   Daily Limit: ${Number(permission.dailyLimit) / 1e6} USDC`);
    console.log(`   Total Limit: ${Number(permission.totalLimit) / 1e6} USDC`);
    console.log(`   Target Dip:  ${Number(permission.targetDipBps) / 100}%`);
    
    const remainingDays = Math.ceil(
      (Number(permission.startTime) + Number(permission.duration) - Date.now() / 1000) / 86400
    );
    console.log(`   Days Left:   ${remainingDays}`);
  } else {
    console.log("   ⚠️ No active permission found");
    console.log("   → Grant permission via the frontend first");
  }
  
  const spent = await coordinator.totalSpent(userAddress);
  console.log(`   Total Spent: ${Number(spent) / 1e6} USDC`);
}

async function issueDelegation(coordinator, userAddress) {
  console.log("🤖 Issuing sub-delegation to ExecutionAgent...");
  
  const permission = await coordinator.getPermission(userAddress);
  if (!permission.active) {
    console.log("   ❌ No active permission. Grant permission first!");
    return;
  }
  
  // Delegate 60% of daily limit
  const delegatedAmount = (permission.dailyLimit * 60n) / 100n;
  
  const tx = await coordinator.issueSubDelegation(
    userAddress,
    CONTRACTS.executionAgent,
    delegatedAmount
  );
  await tx.wait();
  
  console.log(`   ✅ Delegated ${Number(delegatedAmount) / 1e6} USDC/day to ExecutionAgent`);
  console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

async function triggerExecution(executor, userAddress) {
  console.log("⚡ Triggering execution (swap)...");
  
  // Execute a swap with 50 USDC
  const amount = 50n * 10n ** 6n; // 50 USDC
  
  const tx = await executor.executeSwap(userAddress, amount);
  await tx.wait();
  
  console.log(`   ✅ Swap executed!`);
  console.log(`   Amount: 50 USDC`);
  console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

async function showStats(executor, userAddress) {
  console.log("📈 User Stats for", userAddress);
  
  const [ethAccumulated, availableToday] = await executor.getUserStats(userAddress);
  const [swaps, usdcSpent, ethBought] = await executor.getGlobalStats();
  
  console.log("");
  console.log("   Your Stats:");
  console.log(`   ETH Accumulated: ${Number(ethAccumulated) / 1e18} ETH`);
  console.log(`   Available Today: ${Number(availableToday) / 1e6} USDC`);
  console.log("");
  console.log("   Global Stats:");
  console.log(`   Total Swaps:     ${swaps}`);
  console.log(`   Total USDC:      ${Number(usdcSpent) / 1e6} USDC`);
  console.log(`   Total ETH:       ${Number(ethBought) / 1e18} ETH`);
}

async function fullDemo(oracle, coordinator, executor, userAddress) {
  console.log("🎬 FULL DEMO FLOW");
  console.log("=".repeat(50));
  console.log("");
  
  // Step 1: Check permission
  console.log("Step 1: Checking permission...");
  const permission = await coordinator.getPermission(userAddress);
  if (!permission.active) {
    console.log("   ❌ No active permission!");
    console.log("   → Please grant permission via the frontend first");
    console.log("   → Then run this demo again");
    return;
  }
  console.log("   ✅ Permission active!");
  console.log("");
  
  // Step 2: Check current price
  console.log("Step 2: Checking current price...");
  await showPrice(oracle);
  console.log("");
  
  // Step 3: Issue delegation
  console.log("Step 3: Issuing sub-delegation...");
  await issueDelegation(coordinator, userAddress);
  console.log("");
  
  // Wait a bit
  console.log("⏳ Waiting 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));
  console.log("");
  
  // Step 4: Simulate price dip
  console.log("Step 4: Simulating 5% price dip...");
  await triggerDip(oracle, "5");
  console.log("");
  
  // Wait a bit
  console.log("⏳ Waiting 5 seconds...");
  await new Promise(r => setTimeout(r, 5000));
  console.log("");
  
  // Step 5: Execute swap
  console.log("Step 5: Executing swap...");
  await triggerExecution(executor, userAddress);
  console.log("");
  
  // Step 6: Show final stats
  console.log("Step 6: Final stats...");
  await showStats(executor, userAddress);
  console.log("");
  
  console.log("=".repeat(50));
  console.log("🎉 DEMO COMPLETE!");
  console.log("");
  console.log("The user has now:");
  console.log("  1. Granted a permission (via frontend)");
  console.log("  2. Had funds sub-delegated to ExecutionAgent");
  console.log("  3. Seen a price dip trigger automatic buying");
  console.log("  4. Accumulated ETH in their account");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
