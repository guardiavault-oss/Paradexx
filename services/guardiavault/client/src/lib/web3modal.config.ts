import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, sepolia } from 'wagmi/chains';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'f32270e55fe94b09ccfc7a375022bb41';

// 2. Create wagmiConfig
const metadata = {
  name: 'GuardiaVault',
  description: 'Secure crypto inheritance solution',
  url: 'https://guardiavault.com',
  icons: ['https://avatars.githubusercontent.com/u/your-org']
};

const chains = [mainnet, sepolia];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
export const web3modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#4F46E5',
    '--w3m-color-mix-strength': '20',
  },
});

export { wagmiConfig };
