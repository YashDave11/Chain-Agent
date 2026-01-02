const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ChainAgent contracts to", hre.network.name);
  console.log("=".repeat(50));

  // Get the signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  // Sepolia token addresses
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const UNISWAP_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"; // Sepolia Uniswap V2 Router

  // 1. Deploy MockPriceOracle
  console.log("📊 Deploying MockPriceOracle...");
  const MockPriceOracle = await hre.ethers.getContractFactory("MockPriceOracle");
  const mockPriceOracle = await MockPriceOracle.deploy();
  await mockPriceOracle.waitForDeployment();
  const oracleAddress = await mockPriceOracle.getAddress();
  console.log("   MockPriceOracle deployed to:", oracleAddress);

  // 2. Deploy CoordinatorAgent
  console.log("🤖 Deploying CoordinatorAgent...");
  const CoordinatorAgent = await hre.ethers.getContractFactory("CoordinatorAgent");
  const coordinatorAgent = await CoordinatorAgent.deploy(oracleAddress);
  await coordinatorAgent.waitForDeployment();
  const coordinatorAddress = await coordinatorAgent.getAddress();
  console.log("   CoordinatorAgent deployed to:", coordinatorAddress);

  // 3. Deploy ExecutionAgent
  console.log("⚡ Deploying ExecutionAgent...");
  const ExecutionAgent = await hre.ethers.getContractFactory("ExecutionAgent");
  const executionAgent = await ExecutionAgent.deploy(
    coordinatorAddress,
    oracleAddress,
    UNISWAP_ROUTER,
    USDC_ADDRESS,
    WETH_ADDRESS
  );
  await executionAgent.waitForDeployment();
  const executionAddress = await executionAgent.getAddress();
  console.log("   ExecutionAgent deployed to:", executionAddress);

  console.log("");
  console.log("=".repeat(50));
  console.log("✅ All contracts deployed successfully!");
  console.log("");
  console.log("📋 Contract Addresses (copy these to your .env):");
  console.log("=".repeat(50));
  console.log(`NEXT_PUBLIC_MOCK_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`NEXT_PUBLIC_COORDINATOR_AGENT_ADDRESS=${coordinatorAddress}`);
  console.log(`NEXT_PUBLIC_EXECUTION_AGENT_ADDRESS=${executionAddress}`);
  console.log("=".repeat(50));

  console.log("");
  console.log("View contracts on Etherscan:");
  console.log(`  MockPriceOracle: https://sepolia.etherscan.io/address/${oracleAddress}`);
  console.log(`  CoordinatorAgent: https://sepolia.etherscan.io/address/${coordinatorAddress}`);
  console.log(`  ExecutionAgent: https://sepolia.etherscan.io/address/${executionAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
