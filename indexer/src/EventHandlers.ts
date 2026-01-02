// ChainAgent Event Handlers for Envio Indexer
// Processes blockchain events and stores in GraphQL database

import {
  CoordinatorAgentContract,
  ExecutionAgentContract,
  MockPriceOracleContract,
  Permission,
  Delegation,
  Execution,
  DailyStats,
  PriceUpdate,
  QuotaExceeded,
  GlobalStats
} from "generated";

// Helper function to get or create global stats
async function getOrCreateGlobalStats(context: any): Promise<GlobalStats> {
  let stats = await context.GlobalStats.get("global");
  if (!stats) {
    stats = {
      id: "global",
      totalPermissions: 0,
      activePermissions: 0,
      totalDelegations: 0,
      totalExecutions: 0,
      totalUsdcSpent: BigInt(0),
      totalEthBought: BigInt(0),
      lastUpdated: BigInt(0)
    };
  }
  return stats;
}

// Helper function to format date
function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().split('T')[0];
}

// ==========================================
// CoordinatorAgent Event Handlers
// ==========================================

CoordinatorAgentContract.PermissionReceived.handler(async ({ event, context }) => {
  const permissionId = `${event.params.user}-${event.block.timestamp}`;
  
  // Create new permission entity
  const permission: Permission = {
    id: permissionId,
    user: event.params.user,
    token: event.params.token,
    dailyLimit: event.params.dailyLimit,
    totalLimit: event.params.totalLimit,
    duration: event.params.duration,
    targetDipBps: event.params.targetDipBps,
    startTime: BigInt(event.block.timestamp),
    isActive: true,
    totalSpent: BigInt(0),
    createdAt: BigInt(event.block.timestamp),
    revokedAt: undefined
  };

  context.Permission.set(permission);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  stats.totalPermissions += 1;
  stats.activePermissions += 1;
  stats.lastUpdated = BigInt(event.block.timestamp);
  context.GlobalStats.set(stats);

  context.log.info(`Permission received for user ${event.params.user} with daily limit ${event.params.dailyLimit}`);
});

CoordinatorAgentContract.SubDelegationIssued.handler(async ({ event, context }) => {
  const delegationId = `${event.params.user}-${event.params.executor}-${event.block.timestamp}`;
  
  // Find the user's active permission
  // For simplicity, we create a reference to the latest permission
  const permissionId = `${event.params.user}-latest`;
  
  const delegation: Delegation = {
    id: delegationId,
    permission_id: permissionId, // Reference to permission
    user: event.params.user,
    executor: event.params.executor,
    dailyLimit: event.params.dailyLimit,
    isActive: true,
    createdAt: BigInt(event.block.timestamp),
    revokedAt: undefined
  };

  context.Delegation.set(delegation);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  stats.totalDelegations += 1;
  stats.lastUpdated = BigInt(event.block.timestamp);
  context.GlobalStats.set(stats);

  context.log.info(`Sub-delegation issued: ${event.params.dailyLimit} to ${event.params.executor}`);
});

CoordinatorAgentContract.ExecutionTriggered.handler(async ({ event, context }) => {
  const executionId = `${event.transaction.hash}-${event.logIndex}`;
  const dateStr = formatDate(BigInt(event.block.timestamp));
  const dailyStatsId = `${event.params.user}-${dateStr}`;

  // Create execution record
  const execution: Execution = {
    id: executionId,
    permission_id: `${event.params.user}-latest`,
    delegation_id: `${event.params.user}-${event.params.executor}-latest`,
    user: event.params.user,
    executor: event.params.executor,
    tokenIn: "USDC", // We know this from our contract design
    tokenOut: "ETH",
    amountIn: event.params.amount,
    amountOut: BigInt(0), // Will be updated by SwapExecuted event
    price: event.params.price,
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
    blockNumber: BigInt(event.block.number)
  };

  context.Execution.set(execution);

  // Update or create daily stats
  let dailyStats = await context.DailyStats.get(dailyStatsId);
  if (!dailyStats) {
    dailyStats = {
      id: dailyStatsId,
      user: event.params.user,
      date: dateStr,
      totalSpent: BigInt(0),
      totalEthReceived: BigInt(0),
      executionCount: 0,
      averagePrice: BigInt(0)
    };
  }
  
  dailyStats.totalSpent = dailyStats.totalSpent + event.params.amount;
  dailyStats.executionCount += 1;
  dailyStats.averagePrice = event.params.price; // Simplified
  context.DailyStats.set(dailyStats);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  stats.totalExecutions += 1;
  stats.totalUsdcSpent = stats.totalUsdcSpent + event.params.amount;
  stats.lastUpdated = BigInt(event.block.timestamp);
  context.GlobalStats.set(stats);

  context.log.info(`Execution triggered: ${event.params.amount} USDC at price ${event.params.price}`);
});

CoordinatorAgentContract.PermissionRevoked.handler(async ({ event, context }) => {
  // Mark permission as inactive
  // In real implementation, would find and update the specific permission
  context.log.info(`Permission revoked for user ${event.params.user}`);

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  stats.activePermissions = Math.max(0, stats.activePermissions - 1);
  stats.lastUpdated = BigInt(event.block.timestamp);
  context.GlobalStats.set(stats);
});

CoordinatorAgentContract.DelegationRevoked.handler(async ({ event, context }) => {
  context.log.info(`Delegation revoked for user ${event.params.user} executor ${event.params.executor}`);
});

// ==========================================
// ExecutionAgent Event Handlers
// ==========================================

ExecutionAgentContract.SwapExecuted.handler(async ({ event, context }) => {
  const swapId = `swap-${event.transaction.hash}-${event.logIndex}`;
  
  // Create or update execution with swap details
  const execution: Execution = {
    id: swapId,
    permission_id: `${event.params.user}-latest`,
    delegation_id: undefined,
    user: event.params.user,
    executor: event.srcAddress,
    tokenIn: event.params.tokenIn,
    tokenOut: event.params.tokenOut,
    amountIn: event.params.amountIn,
    amountOut: event.params.amountOut,
    price: event.params.price,
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
    blockNumber: BigInt(event.block.number)
  };

  context.Execution.set(execution);

  // Update daily stats with ETH received
  const dateStr = formatDate(BigInt(event.block.timestamp));
  const dailyStatsId = `${event.params.user}-${dateStr}`;
  
  let dailyStats = await context.DailyStats.get(dailyStatsId);
  if (dailyStats) {
    dailyStats.totalEthReceived = dailyStats.totalEthReceived + event.params.amountOut;
    context.DailyStats.set(dailyStats);
  }

  // Update global stats
  const stats = await getOrCreateGlobalStats(context);
  stats.totalEthBought = stats.totalEthBought + event.params.amountOut;
  stats.lastUpdated = BigInt(event.block.timestamp);
  context.GlobalStats.set(stats);

  context.log.info(`Swap executed: ${event.params.amountIn} -> ${event.params.amountOut}`);
});

ExecutionAgentContract.QuotaExceeded.handler(async ({ event, context }) => {
  const quotaId = `quota-${event.transaction.hash}-${event.logIndex}`;
  
  const quota: QuotaExceeded = {
    id: quotaId,
    user: event.params.user,
    requested: event.params.requested,
    available: event.params.available,
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash
  };

  context.QuotaExceeded.set(quota);
  context.log.warn(`Quota exceeded for user ${event.params.user}: requested ${event.params.requested}, available ${event.params.available}`);
});

ExecutionAgentContract.EmergencyWithdraw.handler(async ({ event, context }) => {
  context.log.warn(`Emergency withdraw: ${event.params.amount} of token ${event.params.token}`);
});

// ==========================================
// MockPriceOracle Event Handlers
// ==========================================

MockPriceOracleContract.PriceUpdated.handler(async ({ event, context }) => {
  const priceId = `price-${event.transaction.hash}-${event.logIndex}`;
  
  const priceUpdate: PriceUpdate = {
    id: priceId,
    token: event.params.token,
    oldPrice: event.params.oldPrice,
    newPrice: event.params.newPrice,
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash
  };

  context.PriceUpdate.set(priceUpdate);
  context.log.info(`Price updated: ${event.params.oldPrice} -> ${event.params.newPrice}`);
});

MockPriceOracleContract.OwnershipTransferred.handler(async ({ event, context }) => {
  context.log.info(`Oracle ownership transferred from ${event.params.previousOwner} to ${event.params.newOwner}`);
});
