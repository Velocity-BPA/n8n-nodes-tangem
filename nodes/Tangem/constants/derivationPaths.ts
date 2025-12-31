/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * BIP-44 derivation paths for supported blockchains
 *
 * Standard format: m / purpose' / coin_type' / account' / change / address_index
 */

export interface DerivationPathInfo {
  path: string;
  description: string;
  coinType: number;
  standard: string;
}

/**
 * Standard derivation paths by blockchain
 */
export const DERIVATION_PATHS: Record<string, DerivationPathInfo> = {
  // Bitcoin family
  bitcoin: {
    path: "m/84'/0'/0'/0/0",
    description: 'Bitcoin Native SegWit (BIP-84)',
    coinType: 0,
    standard: 'BIP-84',
  },
  bitcoinLegacy: {
    path: "m/44'/0'/0'/0/0",
    description: 'Bitcoin Legacy (BIP-44)',
    coinType: 0,
    standard: 'BIP-44',
  },
  bitcoinSegwit: {
    path: "m/49'/0'/0'/0/0",
    description: 'Bitcoin SegWit (BIP-49)',
    coinType: 0,
    standard: 'BIP-49',
  },
  bitcoinTaproot: {
    path: "m/86'/0'/0'/0/0",
    description: 'Bitcoin Taproot (BIP-86)',
    coinType: 0,
    standard: 'BIP-86',
  },
  litecoin: {
    path: "m/84'/2'/0'/0/0",
    description: 'Litecoin Native SegWit',
    coinType: 2,
    standard: 'BIP-84',
  },
  dogecoin: {
    path: "m/44'/3'/0'/0/0",
    description: 'Dogecoin',
    coinType: 3,
    standard: 'BIP-44',
  },
  bitcoinCash: {
    path: "m/44'/145'/0'/0/0",
    description: 'Bitcoin Cash',
    coinType: 145,
    standard: 'BIP-44',
  },

  // Ethereum and EVM chains
  ethereum: {
    path: "m/44'/60'/0'/0/0",
    description: 'Ethereum',
    coinType: 60,
    standard: 'BIP-44',
  },
  bsc: {
    path: "m/44'/60'/0'/0/0",
    description: 'BNB Smart Chain (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  polygon: {
    path: "m/44'/60'/0'/0/0",
    description: 'Polygon (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  arbitrum: {
    path: "m/44'/60'/0'/0/0",
    description: 'Arbitrum (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  optimism: {
    path: "m/44'/60'/0'/0/0",
    description: 'Optimism (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  avalanche: {
    path: "m/44'/60'/0'/0/0",
    description: 'Avalanche C-Chain (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  base: {
    path: "m/44'/60'/0'/0/0",
    description: 'Base (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  fantom: {
    path: "m/44'/60'/0'/0/0",
    description: 'Fantom (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  gnosis: {
    path: "m/44'/60'/0'/0/0",
    description: 'Gnosis Chain (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },
  cronos: {
    path: "m/44'/60'/0'/0/0",
    description: 'Cronos (uses ETH coin type)',
    coinType: 60,
    standard: 'BIP-44',
  },

  // Other chains
  solana: {
    path: "m/44'/501'/0'/0'",
    description: 'Solana',
    coinType: 501,
    standard: 'BIP-44',
  },
  cardano: {
    path: "m/1852'/1815'/0'/0/0",
    description: 'Cardano Shelley',
    coinType: 1815,
    standard: 'CIP-1852',
  },
  xrp: {
    path: "m/44'/144'/0'/0/0",
    description: 'XRP Ledger',
    coinType: 144,
    standard: 'BIP-44',
  },
  stellar: {
    path: "m/44'/148'/0'",
    description: 'Stellar',
    coinType: 148,
    standard: 'SEP-0005',
  },
  polkadot: {
    path: "m/44'/354'/0'/0'/0'",
    description: 'Polkadot',
    coinType: 354,
    standard: 'BIP-44',
  },
  kusama: {
    path: "m/44'/434'/0'/0'/0'",
    description: 'Kusama',
    coinType: 434,
    standard: 'BIP-44',
  },
  cosmos: {
    path: "m/44'/118'/0'/0/0",
    description: 'Cosmos Hub',
    coinType: 118,
    standard: 'BIP-44',
  },
  osmosis: {
    path: "m/44'/118'/0'/0/0",
    description: 'Osmosis (uses ATOM coin type)',
    coinType: 118,
    standard: 'BIP-44',
  },
  near: {
    path: "m/44'/397'/0'",
    description: 'Near Protocol',
    coinType: 397,
    standard: 'BIP-44',
  },
  tron: {
    path: "m/44'/195'/0'/0/0",
    description: 'Tron',
    coinType: 195,
    standard: 'BIP-44',
  },
  tezos: {
    path: "m/44'/1729'/0'/0'",
    description: 'Tezos',
    coinType: 1729,
    standard: 'BIP-44',
  },
  algorand: {
    path: "m/44'/283'/0'/0'/0'",
    description: 'Algorand',
    coinType: 283,
    standard: 'BIP-44',
  },
  hedera: {
    path: "m/44'/3030'/0'/0'/0'",
    description: 'Hedera',
    coinType: 3030,
    standard: 'BIP-44',
  },
};

/**
 * Parse a derivation path string into components
 */
export interface DerivationPathComponent {
  index: number;
  hardened: boolean;
}

export function parseDerivationPath(path: string): DerivationPathComponent[] {
  const components: DerivationPathComponent[] = [];
  const parts = path.split('/').slice(1); // Remove 'm' prefix

  for (const part of parts) {
    const hardened = part.endsWith("'") || part.endsWith('h');
    const index = parseInt(part.replace(/['h]/g, ''), 10);
    components.push({ index, hardened });
  }

  return components;
}

/**
 * Build a derivation path string from components
 */
export function buildDerivationPath(components: DerivationPathComponent[]): string {
  const parts = components.map((c) => `${c.index}${c.hardened ? "'" : ''}`);
  return `m/${parts.join('/')}`;
}

/**
 * Get derivation path for a specific account and address index
 */
export function getDerivationPathForAddress(
  blockchain: string,
  account: number = 0,
  change: number = 0,
  addressIndex: number = 0,
): string {
  const baseInfo = DERIVATION_PATHS[blockchain.toLowerCase()];
  if (!baseInfo) {
    return DERIVATION_PATHS.ethereum.path; // Default to Ethereum path
  }

  // Parse the base path and modify for the specific address
  const components = parseDerivationPath(baseInfo.path);

  // Update account, change, and address index based on standard
  if (components.length >= 3) {
    components[2] = { index: account, hardened: components[2].hardened };
  }
  if (components.length >= 4) {
    components[3] = { index: change, hardened: components[3].hardened };
  }
  if (components.length >= 5) {
    components[4] = { index: addressIndex, hardened: components[4].hardened };
  }

  return buildDerivationPath(components);
}

/**
 * Get coin type for a blockchain
 */
export function getCoinType(blockchain: string): number {
  const info = DERIVATION_PATHS[blockchain.toLowerCase()];
  return info?.coinType ?? 60; // Default to Ethereum coin type
}

/**
 * Validate a derivation path format
 */
export function isValidDerivationPath(path: string): boolean {
  const regex = /^m(\/\d+['h]?)+$/;
  return regex.test(path);
}
