import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const CONTRACT_ADDRESSES = {
  mockPriceOracle: '0x11aa01e0d27fd26aed1d7a82a4c25433ee9de3aa' as `0x${string}`,
  coordinatorAgent: '0x7b3227c2337672eebed0fe0616ecd3796c6a6f1d' as `0x${string}`,
  executionAgent: '0x594bd38fc2d9b9bdead9b3d24e29f0b0f1e0bb87' as `0x${string}`,
} as const;

export const TOKEN_ADDRESSES = {
  usdc: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' as `0x${string}`,
  weth: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14' as `0x${string}`,
} as const;


export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
  },
});


declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
