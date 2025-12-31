/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Supported blockchain networks and their configurations
 */

export interface ChainConfig {
  name: string;
  chainId?: number;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  networkType: string;
}

export const EVM_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    networkType: 'evm',
  },
  goerli: {
    name: 'Ethereum Goerli',
    chainId: 5,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.goerli.mudit.blog',
    explorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true,
    networkType: 'evm',
  },
  bsc: {
    name: 'BNB Smart Chain',
    chainId: 56,
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    isTestnet: false,
    networkType: 'evm',
  },
  bscTestnet: {
    name: 'BNB Testnet',
    chainId: 97,
    symbol: 'tBNB',
    decimals: 18,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    isTestnet: true,
    networkType: 'evm',
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    networkType: 'evm',
  },
  polygonMumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    isTestnet: true,
    networkType: 'evm',
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    isTestnet: true,
    networkType: 'evm',
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  optimismSepolia: {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    isTestnet: true,
    networkType: 'evm',
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    isTestnet: false,
    networkType: 'evm',
  },
  avalancheFuji: {
    name: 'Avalanche Fuji',
    chainId: 43113,
    symbol: 'AVAX',
    decimals: 18,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    isTestnet: true,
    networkType: 'evm',
  },
  base: {
    name: 'Base',
    chainId: 8453,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
    networkType: 'evm',
  },
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
    networkType: 'evm',
  },
  fantom: {
    name: 'Fantom Opera',
    chainId: 250,
    symbol: 'FTM',
    decimals: 18,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    isTestnet: false,
    networkType: 'evm',
  },
  gnosis: {
    name: 'Gnosis Chain',
    chainId: 100,
    symbol: 'xDAI',
    decimals: 18,
    rpcUrl: 'https://rpc.gnosischain.com',
    explorerUrl: 'https://gnosisscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  cronos: {
    name: 'Cronos',
    chainId: 25,
    symbol: 'CRO',
    decimals: 18,
    rpcUrl: 'https://evm.cronos.org',
    explorerUrl: 'https://cronoscan.com',
    isTestnet: false,
    networkType: 'evm',
  },
  zksync: {
    name: 'zkSync Era',
    chainId: 324,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    isTestnet: false,
    networkType: 'evm',
  },
  linea: {
    name: 'Linea',
    chainId: 59144,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    isTestnet: false,
    networkType: 'evm',
  },
  scroll: {
    name: 'Scroll',
    chainId: 534352,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    isTestnet: false,
    networkType: 'evm',
  },
  mantle: {
    name: 'Mantle',
    chainId: 5000,
    symbol: 'MNT',
    decimals: 18,
    rpcUrl: 'https://rpc.mantle.xyz',
    explorerUrl: 'https://explorer.mantle.xyz',
    isTestnet: false,
    networkType: 'evm',
  },
  blast: {
    name: 'Blast',
    chainId: 81457,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://rpc.blast.io',
    explorerUrl: 'https://blastscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  celo: {
    name: 'Celo',
    chainId: 42220,
    symbol: 'CELO',
    decimals: 18,
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  moonbeam: {
    name: 'Moonbeam',
    chainId: 1284,
    symbol: 'GLMR',
    decimals: 18,
    rpcUrl: 'https://rpc.api.moonbeam.network',
    explorerUrl: 'https://moonbeam.moonscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  moonriver: {
    name: 'Moonriver',
    chainId: 1285,
    symbol: 'MOVR',
    decimals: 18,
    rpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
    explorerUrl: 'https://moonriver.moonscan.io',
    isTestnet: false,
    networkType: 'evm',
  },
  klaytn: {
    name: 'Klaytn',
    chainId: 8217,
    symbol: 'KLAY',
    decimals: 18,
    rpcUrl: 'https://public-node-api.klaytnapi.com/v1/cypress',
    explorerUrl: 'https://scope.klaytn.com',
    isTestnet: false,
    networkType: 'evm',
  },
  aurora: {
    name: 'Aurora',
    chainId: 1313161554,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.aurora.dev',
    explorerUrl: 'https://aurorascan.dev',
    isTestnet: false,
    networkType: 'evm',
  },
  harmony: {
    name: 'Harmony One',
    chainId: 1666600000,
    symbol: 'ONE',
    decimals: 18,
    rpcUrl: 'https://api.harmony.one',
    explorerUrl: 'https://explorer.harmony.one',
    isTestnet: false,
    networkType: 'evm',
  },
  metis: {
    name: 'Metis Andromeda',
    chainId: 1088,
    symbol: 'METIS',
    decimals: 18,
    rpcUrl: 'https://andromeda.metis.io/?owner=1088',
    explorerUrl: 'https://andromeda-explorer.metis.io',
    isTestnet: false,
    networkType: 'evm',
  },
  boba: {
    name: 'Boba Network',
    chainId: 288,
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.boba.network',
    explorerUrl: 'https://bobascan.com',
    isTestnet: false,
    networkType: 'evm',
  },
};

export const BITCOIN_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  mainnet: {
    name: 'Bitcoin Mainnet',
    symbol: 'BTC',
    decimals: 8,
    rpcUrl: 'https://blockstream.info/api',
    explorerUrl: 'https://blockstream.info',
    isTestnet: false,
    networkType: 'bitcoin',
  },
  testnet: {
    name: 'Bitcoin Testnet',
    symbol: 'tBTC',
    decimals: 8,
    rpcUrl: 'https://blockstream.info/testnet/api',
    explorerUrl: 'https://blockstream.info/testnet',
    isTestnet: true,
    networkType: 'bitcoin',
  },
  signet: {
    name: 'Bitcoin Signet',
    symbol: 'sBTC',
    decimals: 8,
    rpcUrl: 'https://mempool.space/signet/api',
    explorerUrl: 'https://mempool.space/signet',
    isTestnet: true,
    networkType: 'bitcoin',
  },
};

export const SOLANA_CLUSTERS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  'mainnet-beta': {
    name: 'Solana Mainnet',
    symbol: 'SOL',
    decimals: 9,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    isTestnet: false,
    networkType: 'solana',
  },
  testnet: {
    name: 'Solana Testnet',
    symbol: 'SOL',
    decimals: 9,
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://solscan.io?cluster=testnet',
    isTestnet: true,
    networkType: 'solana',
  },
  devnet: {
    name: 'Solana Devnet',
    symbol: 'SOL',
    decimals: 9,
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io?cluster=devnet',
    isTestnet: true,
    networkType: 'solana',
  },
};

export const CARDANO_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  mainnet: {
    name: 'Cardano Mainnet',
    symbol: 'ADA',
    decimals: 6,
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
    isTestnet: false,
    networkType: 'cardano',
  },
  preprod: {
    name: 'Cardano Preprod',
    symbol: 'tADA',
    decimals: 6,
    rpcUrl: 'https://cardano-preprod.blockfrost.io/api/v0',
    explorerUrl: 'https://preprod.cardanoscan.io',
    isTestnet: true,
    networkType: 'cardano',
  },
  preview: {
    name: 'Cardano Preview',
    symbol: 'tADA',
    decimals: 6,
    rpcUrl: 'https://cardano-preview.blockfrost.io/api/v0',
    explorerUrl: 'https://preview.cardanoscan.io',
    isTestnet: true,
    networkType: 'cardano',
  },
};

export const XRP_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  mainnet: {
    name: 'XRP Ledger Mainnet',
    symbol: 'XRP',
    decimals: 6,
    rpcUrl: 'wss://s1.ripple.com',
    explorerUrl: 'https://xrpscan.com',
    isTestnet: false,
    networkType: 'xrp',
  },
  testnet: {
    name: 'XRP Ledger Testnet',
    symbol: 'XRP',
    decimals: 6,
    rpcUrl: 'wss://s.altnet.rippletest.net:51233',
    explorerUrl: 'https://testnet.xrpl.org',
    isTestnet: true,
    networkType: 'xrp',
  },
  devnet: {
    name: 'XRP Ledger Devnet',
    symbol: 'XRP',
    decimals: 6,
    rpcUrl: 'wss://s.devnet.rippletest.net:51233',
    explorerUrl: 'https://devnet.xrpl.org',
    isTestnet: true,
    networkType: 'xrp',
  },
};

export const STELLAR_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  public: {
    name: 'Stellar Public Network',
    symbol: 'XLM',
    decimals: 7,
    rpcUrl: 'https://horizon.stellar.org',
    explorerUrl: 'https://stellarchain.io',
    isTestnet: false,
    networkType: 'stellar',
  },
  testnet: {
    name: 'Stellar Test Network',
    symbol: 'XLM',
    decimals: 7,
    rpcUrl: 'https://horizon-testnet.stellar.org',
    explorerUrl: 'https://testnet.stellarchain.io',
    isTestnet: true,
    networkType: 'stellar',
  },
};

export const POLKADOT_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  polkadot: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 10,
    rpcUrl: 'wss://rpc.polkadot.io',
    explorerUrl: 'https://polkadot.subscan.io',
    isTestnet: false,
    networkType: 'polkadot',
  },
  kusama: {
    name: 'Kusama',
    symbol: 'KSM',
    decimals: 12,
    rpcUrl: 'wss://kusama-rpc.polkadot.io',
    explorerUrl: 'https://kusama.subscan.io',
    isTestnet: false,
    networkType: 'polkadot',
  },
  westend: {
    name: 'Westend',
    symbol: 'WND',
    decimals: 12,
    rpcUrl: 'wss://westend-rpc.polkadot.io',
    explorerUrl: 'https://westend.subscan.io',
    isTestnet: true,
    networkType: 'polkadot',
  },
};

export const COSMOS_CHAINS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  cosmoshub: {
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    decimals: 6,
    rpcUrl: 'https://cosmos-rpc.publicnode.com:443',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    isTestnet: false,
    networkType: 'cosmos',
  },
  osmosis: {
    name: 'Osmosis',
    symbol: 'OSMO',
    decimals: 6,
    rpcUrl: 'https://osmosis-rpc.publicnode.com:443',
    explorerUrl: 'https://www.mintscan.io/osmosis',
    isTestnet: false,
    networkType: 'cosmos',
  },
  juno: {
    name: 'Juno',
    symbol: 'JUNO',
    decimals: 6,
    rpcUrl: 'https://juno-rpc.publicnode.com:443',
    explorerUrl: 'https://www.mintscan.io/juno',
    isTestnet: false,
    networkType: 'cosmos',
  },
  kava: {
    name: 'Kava',
    symbol: 'KAVA',
    decimals: 6,
    rpcUrl: 'https://kava-rpc.publicnode.com:443',
    explorerUrl: 'https://www.mintscan.io/kava',
    isTestnet: false,
    networkType: 'cosmos',
  },
  evmos: {
    name: 'Evmos',
    symbol: 'EVMOS',
    decimals: 18,
    rpcUrl: 'https://evmos-rpc.publicnode.com:443',
    explorerUrl: 'https://www.mintscan.io/evmos',
    isTestnet: false,
    networkType: 'cosmos',
  },
};

export const NEAR_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  mainnet: {
    name: 'Near Mainnet',
    symbol: 'NEAR',
    decimals: 24,
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io',
    isTestnet: false,
    networkType: 'near',
  },
  testnet: {
    name: 'Near Testnet',
    symbol: 'NEAR',
    decimals: 24,
    rpcUrl: 'https://rpc.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
    isTestnet: true,
    networkType: 'near',
  },
};

export const TRON_NETWORKS: Record<string, Omit<ChainConfig, 'chainId'>> = {
  mainnet: {
    name: 'Tron Mainnet',
    symbol: 'TRX',
    decimals: 6,
    rpcUrl: 'https://api.trongrid.io',
    explorerUrl: 'https://tronscan.org',
    isTestnet: false,
    networkType: 'tron',
  },
  shasta: {
    name: 'Tron Shasta Testnet',
    symbol: 'TRX',
    decimals: 6,
    rpcUrl: 'https://api.shasta.trongrid.io',
    explorerUrl: 'https://shasta.tronscan.org',
    isTestnet: true,
    networkType: 'tron',
  },
  nile: {
    name: 'Tron Nile Testnet',
    symbol: 'TRX',
    decimals: 6,
    rpcUrl: 'https://nile.trongrid.io',
    explorerUrl: 'https://nile.tronscan.org',
    isTestnet: true,
    networkType: 'tron',
  },
};

/**
 * Get all supported blockchain networks
 */
export function getAllSupportedChains(): string[] {
  return [
    ...Object.keys(EVM_CHAINS),
    ...Object.keys(BITCOIN_NETWORKS),
    ...Object.keys(SOLANA_CLUSTERS),
    ...Object.keys(CARDANO_NETWORKS),
    ...Object.keys(XRP_NETWORKS),
    ...Object.keys(STELLAR_NETWORKS),
    ...Object.keys(POLKADOT_NETWORKS),
    ...Object.keys(COSMOS_CHAINS),
    ...Object.keys(NEAR_NETWORKS),
    ...Object.keys(TRON_NETWORKS),
  ];
}

/**
 * Get chain configuration by network key
 */
export function getChainConfig(networkKey: string): ChainConfig | undefined {
  return (
    EVM_CHAINS[networkKey] ||
    BITCOIN_NETWORKS[networkKey] ||
    SOLANA_CLUSTERS[networkKey] ||
    CARDANO_NETWORKS[networkKey] ||
    XRP_NETWORKS[networkKey] ||
    STELLAR_NETWORKS[networkKey] ||
    POLKADOT_NETWORKS[networkKey] ||
    COSMOS_CHAINS[networkKey] ||
    NEAR_NETWORKS[networkKey] ||
    TRON_NETWORKS[networkKey]
  ) as ChainConfig | undefined;
}
