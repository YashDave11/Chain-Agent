// CoordinatorAgent ABI - key functions only
export const CoordinatorAgentABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'dailyLimit', type: 'uint256' },
      { name: 'totalLimit', type: 'uint256' },
      { name: 'durationDays', type: 'uint256' },
      { name: 'targetDipBps', type: 'uint256' },
    ],
    name: 'receivePermission',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getPermission',
    outputs: [
      {
        components: [
          { name: 'user', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'dailyLimit', type: 'uint256' },
          { name: 'totalLimit', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'duration', type: 'uint256' },
          { name: 'targetDipBps', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getDailySpent',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getRemainingTotal',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'totalSpent',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: false, name: 'dailyLimit', type: 'uint256' },
      { indexed: false, name: 'totalLimit', type: 'uint256' },
      { indexed: false, name: 'duration', type: 'uint256' },
      { indexed: false, name: 'targetDipBps', type: 'uint256' },
    ],
    name: 'PermissionReceived',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'executor', type: 'address' },
      { indexed: false, name: 'dailyLimit', type: 'uint256' },
    ],
    name: 'SubDelegationIssued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'executor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
    name: 'ExecutionTriggered',
    type: 'event',
  },
] as const;

// ExecutionAgent ABI - key functions only
export const ExecutionAgentABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStats',
    outputs: [
      { name: 'ethAccumulated', type: 'uint256' },
      { name: 'availableToday', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGlobalStats',
    outputs: [
      { name: 'swaps', type: 'uint256' },
      { name: 'usdcSpent', type: 'uint256' },
      { name: 'ethBought', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'tokenIn', type: 'address' },
      { indexed: true, name: 'tokenOut', type: 'address' },
      { indexed: false, name: 'amountIn', type: 'uint256' },
      { indexed: false, name: 'amountOut', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
    name: 'SwapExecuted',
    type: 'event',
  },
] as const;

// MockPriceOracle ABI
export const MockPriceOracleABI = [
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'targetDipBps', type: 'uint256' },
    ],
    name: 'checkPriceDip',
    outputs: [
      { name: 'hasDipped', type: 'bool' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'dropPercentBps', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
