/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Tangem card versions, generations, and configurations
 */

export enum CardType {
  Wallet2 = 'wallet2',
  Wallet3 = 'wallet3',
  Note = 'note',
  Ring = 'ring',
  Custom = 'custom',
  Developer = 'developer',
}

export enum FirmwareType {
  Release = 'release',
  Sdk = 'sdk',
  Special = 'special',
}

export interface CardGeneration {
  version: string;
  name: string;
  features: string[];
  maxWallets: number;
  maxSignatures?: number;
  supportedCurves: string[];
  hdWalletSupport: boolean;
  backupSupport: boolean;
  accessCodeSupport: boolean;
  passcodeSupport: boolean;
  attestationSupport: boolean;
}

/**
 * Tangem card generations and their capabilities
 */
export const CARD_GENERATIONS: Record<string, CardGeneration> = {
  '1.0': {
    version: '1.0',
    name: 'Tangem Generation 1',
    features: ['Basic wallet', 'Single signature'],
    maxWallets: 1,
    maxSignatures: 100000,
    supportedCurves: ['secp256k1'],
    hdWalletSupport: false,
    backupSupport: false,
    accessCodeSupport: false,
    passcodeSupport: false,
    attestationSupport: false,
  },
  '2.0': {
    version: '2.0',
    name: 'Tangem Generation 2',
    features: ['Multi-wallet', 'HD derivation', 'Backup cards'],
    maxWallets: 3,
    supportedCurves: ['secp256k1', 'ed25519'],
    hdWalletSupport: true,
    backupSupport: true,
    accessCodeSupport: true,
    passcodeSupport: false,
    attestationSupport: true,
  },
  '3.0': {
    version: '3.0',
    name: 'Tangem Generation 3',
    features: ['Multi-wallet', 'HD derivation', 'Backup cards', 'Passcode', 'Ring support'],
    maxWallets: 10,
    supportedCurves: ['secp256k1', 'ed25519', 'secp256r1', 'bls12381_g2', 'bip0340'],
    hdWalletSupport: true,
    backupSupport: true,
    accessCodeSupport: true,
    passcodeSupport: true,
    attestationSupport: true,
  },
  '4.0': {
    version: '4.0',
    name: 'Tangem Generation 4',
    features: [
      'Multi-wallet',
      'HD derivation',
      'Backup cards',
      'Passcode',
      'Ring support',
      'Advanced security',
    ],
    maxWallets: 50,
    supportedCurves: ['secp256k1', 'ed25519', 'ed25519_slip0010', 'secp256r1', 'bls12381_g2', 'bip0340'],
    hdWalletSupport: true,
    backupSupport: true,
    accessCodeSupport: true,
    passcodeSupport: true,
    attestationSupport: true,
  },
};

/**
 * Card status values
 */
export enum CardStatus {
  NotPersonalized = 'not_personalized',
  Empty = 'empty',
  Loaded = 'loaded',
  Purged = 'purged',
}

/**
 * Wallet status values
 */
export enum WalletStatus {
  Empty = 'empty',
  Loaded = 'loaded',
  Purged = 'purged',
}

/**
 * Card settings mask - features that can be enabled/disabled
 */
export interface CardSettingsMask {
  isReusable: boolean;
  useActivation: boolean;
  prohibitPurgeWallet: boolean;
  useBlock: boolean;
  allowSetPIN1: boolean;
  allowSetPIN2: boolean;
  useCvc: boolean;
  prohibitDefaultPIN1: boolean;
  useOneCommandAtTime: boolean;
  useNDEF: boolean;
  useDynamicNDEF: boolean;
  smartSecurityDelay: boolean;
  allowUnencrypted: boolean;
  allowFastEncryption: boolean;
  protectIssuerDataAgainstReplay: boolean;
  restrictOverwriteIssuerExtraData: boolean;
  allowSelectBlockchain: boolean;
  disablePrecomputedNDEF: boolean;
  skipSecurityDelayIfValidatedByIssuer: boolean;
  skipCheckPIN2CVCIfValidatedByIssuer: boolean;
  skipSecurityDelayIfValidatedByLinkedTerminal: boolean;
  permanentWallet: boolean;
  isHDWalletAllowed: boolean;
  isBackupAllowed: boolean;
  isKeysImportAllowed: boolean;
}

/**
 * Default settings mask for different card types
 */
export const DEFAULT_SETTINGS_MASKS: Record<CardType, Partial<CardSettingsMask>> = {
  [CardType.Wallet2]: {
    isReusable: true,
    allowSetPIN1: true,
    isHDWalletAllowed: true,
    isBackupAllowed: true,
    permanentWallet: false,
  },
  [CardType.Wallet3]: {
    isReusable: true,
    allowSetPIN1: true,
    allowSetPIN2: true,
    isHDWalletAllowed: true,
    isBackupAllowed: true,
    permanentWallet: false,
  },
  [CardType.Note]: {
    isReusable: false,
    permanentWallet: true,
    isHDWalletAllowed: false,
    isBackupAllowed: false,
  },
  [CardType.Ring]: {
    isReusable: true,
    allowSetPIN1: true,
    allowSetPIN2: true,
    isHDWalletAllowed: true,
    isBackupAllowed: true,
    permanentWallet: false,
  },
  [CardType.Custom]: {
    isReusable: true,
    isHDWalletAllowed: true,
    isBackupAllowed: true,
  },
  [CardType.Developer]: {
    isReusable: true,
    allowSetPIN1: true,
    allowSetPIN2: true,
    isHDWalletAllowed: true,
    isBackupAllowed: true,
    isKeysImportAllowed: true,
  },
};

/**
 * Signing method types
 */
export enum SigningMethod {
  SignHash = 'sign_hash',
  SignRaw = 'sign_raw',
  SignHashSignedByIssuer = 'sign_hash_signed_by_issuer',
  SignRawSignedByIssuer = 'sign_raw_signed_by_issuer',
  SignHashSignedByIssuerAndUpdateIssuerData = 'sign_hash_signed_by_issuer_and_update_issuer_data',
  SignRawSignedByIssuerAndUpdateIssuerData = 'sign_raw_signed_by_issuer_and_update_issuer_data',
  SignPos = 'sign_pos',
}

/**
 * Product mask - card product identification
 */
export enum ProductMask {
  Note = 'note',
  Tag = 'tag',
  IdCard = 'id_card',
  IdIssuer = 'id_issuer',
  TwinCard = 'twin_card',
  Wallet = 'wallet',
  Wallet2 = 'wallet2',
  Ring = 'ring',
}

/**
 * Batch IDs for different Tangem products
 */
export const KNOWN_BATCH_IDS: Record<string, string> = {
  '0027': 'Tangem Wallet',
  '0030': 'Tangem Wallet 2.0',
  '0031': 'Tangem Note BTC',
  '0032': 'Tangem Note ETH',
  '0033': 'Tangem Note XRP',
  '0034': 'Tangem Wallet 3 Cards',
  '0035': 'Tangem Ring',
  '0036': 'Tangem Developer Card',
  '0037': 'Tangem Note SOL',
  '0038': 'Tangem Note ADA',
  '0039': 'Tangem Note DOGE',
  '0040': 'Tangem Note LTC',
};

/**
 * Get card generation by firmware version
 */
export function getCardGeneration(firmwareVersion: string): CardGeneration | undefined {
  const majorVersion = firmwareVersion.split('.')[0];
  return CARD_GENERATIONS[`${majorVersion}.0`];
}

/**
 * Get product name by batch ID
 */
export function getProductByBatchId(batchId: string): string {
  return KNOWN_BATCH_IDS[batchId] || 'Unknown Tangem Product';
}

/**
 * Check if a card supports HD wallets
 */
export function supportsHdWallet(firmwareVersion: string): boolean {
  const generation = getCardGeneration(firmwareVersion);
  return generation?.hdWalletSupport ?? false;
}

/**
 * Check if a card supports backup
 */
export function supportsBackup(firmwareVersion: string): boolean {
  const generation = getCardGeneration(firmwareVersion);
  return generation?.backupSupport ?? false;
}
