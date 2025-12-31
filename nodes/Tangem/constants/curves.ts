/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Elliptic curves supported by Tangem cards
 */

export enum EllipticCurve {
  Secp256k1 = 'secp256k1',
  Secp256r1 = 'secp256r1',
  Ed25519 = 'ed25519',
  Ed25519Slip0010 = 'ed25519_slip0010',
  Bls12381G2 = 'bls12381_g2',
  Bip0340 = 'bip0340',
}

export interface CurveInfo {
  name: string;
  description: string;
  keySize: number;
  signatureSize: number;
  supportedBlockchains: string[];
}

export const CURVE_INFO: Record<EllipticCurve, CurveInfo> = {
  [EllipticCurve.Secp256k1]: {
    name: 'secp256k1',
    description: 'Used by Bitcoin, Ethereum, and most EVM-compatible chains',
    keySize: 32,
    signatureSize: 64,
    supportedBlockchains: [
      'Bitcoin',
      'Ethereum',
      'Litecoin',
      'Dogecoin',
      'Bitcoin Cash',
      'BNB Chain',
      'Polygon',
      'Avalanche',
      'Arbitrum',
      'Optimism',
      'Base',
      'Fantom',
      'Tron',
    ],
  },
  [EllipticCurve.Secp256r1]: {
    name: 'secp256r1 (P-256)',
    description: 'NIST P-256 curve, used by some enterprise blockchains',
    keySize: 32,
    signatureSize: 64,
    supportedBlockchains: ['NEO', 'Ontology'],
  },
  [EllipticCurve.Ed25519]: {
    name: 'Ed25519',
    description: 'Edwards curve, used by Solana, Cardano, Stellar, and others',
    keySize: 32,
    signatureSize: 64,
    supportedBlockchains: ['Solana', 'Cardano', 'Stellar', 'Near', 'Polkadot', 'Cosmos', 'Tezos'],
  },
  [EllipticCurve.Ed25519Slip0010]: {
    name: 'Ed25519 SLIP-0010',
    description: 'Ed25519 with SLIP-0010 derivation for HD wallets',
    keySize: 32,
    signatureSize: 64,
    supportedBlockchains: ['Solana', 'Stellar', 'Near'],
  },
  [EllipticCurve.Bls12381G2]: {
    name: 'BLS12-381 G2',
    description: 'BLS signature scheme, used by Ethereum 2.0 validators',
    keySize: 48,
    signatureSize: 96,
    supportedBlockchains: ['Ethereum 2.0', 'Filecoin'],
  },
  [EllipticCurve.Bip0340]: {
    name: 'BIP-340 Schnorr',
    description: 'Schnorr signatures for Bitcoin Taproot',
    keySize: 32,
    signatureSize: 64,
    supportedBlockchains: ['Bitcoin (Taproot)'],
  },
};

/**
 * Map blockchain to recommended curve
 */
export const BLOCKCHAIN_CURVES: Record<string, EllipticCurve> = {
  // Bitcoin family
  bitcoin: EllipticCurve.Secp256k1,
  litecoin: EllipticCurve.Secp256k1,
  dogecoin: EllipticCurve.Secp256k1,
  bitcoinCash: EllipticCurve.Secp256k1,

  // Ethereum and EVM
  ethereum: EllipticCurve.Secp256k1,
  bsc: EllipticCurve.Secp256k1,
  polygon: EllipticCurve.Secp256k1,
  avalanche: EllipticCurve.Secp256k1,
  arbitrum: EllipticCurve.Secp256k1,
  optimism: EllipticCurve.Secp256k1,
  base: EllipticCurve.Secp256k1,
  fantom: EllipticCurve.Secp256k1,
  gnosis: EllipticCurve.Secp256k1,
  cronos: EllipticCurve.Secp256k1,
  zksync: EllipticCurve.Secp256k1,
  linea: EllipticCurve.Secp256k1,
  scroll: EllipticCurve.Secp256k1,
  mantle: EllipticCurve.Secp256k1,
  blast: EllipticCurve.Secp256k1,

  // Ed25519 chains
  solana: EllipticCurve.Ed25519Slip0010,
  cardano: EllipticCurve.Ed25519,
  stellar: EllipticCurve.Ed25519,
  near: EllipticCurve.Ed25519Slip0010,
  polkadot: EllipticCurve.Ed25519,
  cosmos: EllipticCurve.Ed25519,
  tezos: EllipticCurve.Ed25519,

  // Others
  xrp: EllipticCurve.Secp256k1,
  tron: EllipticCurve.Secp256k1,
};

/**
 * Get the recommended curve for a blockchain
 */
export function getCurveForBlockchain(blockchain: string): EllipticCurve {
  return BLOCKCHAIN_CURVES[blockchain.toLowerCase()] || EllipticCurve.Secp256k1;
}

/**
 * Check if a curve is supported for HD derivation
 */
export function supportsHdDerivation(curve: EllipticCurve): boolean {
  return [
    EllipticCurve.Secp256k1,
    EllipticCurve.Ed25519Slip0010,
    EllipticCurve.Bip0340,
  ].includes(curve);
}

/**
 * Get all supported curves
 */
export function getSupportedCurves(): EllipticCurve[] {
  return Object.values(EllipticCurve);
}
