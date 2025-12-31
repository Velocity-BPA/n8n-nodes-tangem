/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Card utility functions for Tangem operations
 */

import {
  CardType,
  CardStatus,
  WalletStatus,
  CardGeneration,
  CardSettingsMask,
  CARD_GENERATIONS,
  DEFAULT_SETTINGS_MASKS,
  getCardGeneration,
  getProductByBatchId,
} from '../constants/cardVersions';
import { EllipticCurve, getCurveForBlockchain } from '../constants/curves';

/**
 * Card information structure
 */
export interface CardInfo {
  cardId: string;
  batchId: string;
  manufacturerName: string;
  firmwareVersion: string;
  cardType: CardType;
  status: CardStatus;
  isActivated: boolean;
  walletCount: number;
  maxWallets: number;
  supportedCurves: EllipticCurve[];
  isHDWalletAllowed: boolean;
  isBackupAllowed: boolean;
  hasAccessCode: boolean;
  hasPasscode: boolean;
  backupStatus?: BackupStatus;
  attestation?: AttestationInfo;
}

/**
 * Wallet information structure
 */
export interface WalletInfo {
  publicKey: string;
  curve: EllipticCurve;
  status: WalletStatus;
  index: number;
  totalSignedHashes?: number;
  remainingSignatures?: number;
  isHD: boolean;
  derivedKeys?: DerivedKeyInfo[];
  settings?: WalletSettings;
}

/**
 * Derived key information for HD wallets
 */
export interface DerivedKeyInfo {
  derivationPath: string;
  publicKey: string;
  chainCode?: string;
}

/**
 * Wallet settings
 */
export interface WalletSettings {
  isReusable: boolean;
  prohibitPurge: boolean;
  securityDelay: number;
}

/**
 * Backup status information
 */
export interface BackupStatus {
  isBackedUp: boolean;
  backupCardCount: number;
  primaryCardId?: string;
  backupCardIds: string[];
  status: 'none' | 'inProgress' | 'complete';
}

/**
 * Attestation information
 */
export interface AttestationInfo {
  isValid: boolean;
  cardKeyAttestation: boolean;
  walletKeysAttestation: boolean;
  firmwareAttestation: boolean;
  cardUniqueAttestation: boolean;
  attestationStatus: 'verified' | 'failed' | 'skipped' | 'notSupported';
}

/**
 * Parse card info from raw card data
 */
export function parseCardInfo(rawData: Record<string, unknown>): CardInfo {
  const firmwareVersion = String(rawData.firmwareVersion || '1.0');
  const generation = getCardGeneration(firmwareVersion);

  return {
    cardId: String(rawData.cardId || ''),
    batchId: String(rawData.batchId || ''),
    manufacturerName: String(rawData.manufacturerName || 'Tangem'),
    firmwareVersion,
    cardType: parseCardType(rawData.cardType as string | undefined),
    status: parseCardStatus(rawData.status as string | undefined),
    isActivated: Boolean(rawData.isActivated),
    walletCount: Number(rawData.walletCount || 0),
    maxWallets: generation?.maxWallets || 1,
    supportedCurves: parseSupportedCurves(rawData.supportedCurves as string[] | undefined, generation),
    isHDWalletAllowed: Boolean(rawData.isHDWalletAllowed ?? generation?.hdWalletSupport),
    isBackupAllowed: Boolean(rawData.isBackupAllowed ?? generation?.backupSupport),
    hasAccessCode: Boolean(rawData.hasAccessCode),
    hasPasscode: Boolean(rawData.hasPasscode),
  };
}

/**
 * Parse card type from string
 */
export function parseCardType(typeStr?: string): CardType {
  switch (typeStr?.toLowerCase()) {
    case 'wallet2':
    case 'wallet_2':
      return CardType.Wallet2;
    case 'wallet3':
    case 'wallet_3':
      return CardType.Wallet3;
    case 'note':
      return CardType.Note;
    case 'ring':
      return CardType.Ring;
    case 'custom':
      return CardType.Custom;
    case 'developer':
      return CardType.Developer;
    default:
      return CardType.Wallet3;
  }
}

/**
 * Parse card status from string
 */
export function parseCardStatus(statusStr?: string): CardStatus {
  switch (statusStr?.toLowerCase()) {
    case 'not_personalized':
    case 'notpersonalized':
      return CardStatus.NotPersonalized;
    case 'empty':
      return CardStatus.Empty;
    case 'loaded':
      return CardStatus.Loaded;
    case 'purged':
      return CardStatus.Purged;
    default:
      return CardStatus.Empty;
  }
}

/**
 * Parse wallet status from string
 */
export function parseWalletStatus(statusStr?: string): WalletStatus {
  switch (statusStr?.toLowerCase()) {
    case 'empty':
      return WalletStatus.Empty;
    case 'loaded':
      return WalletStatus.Loaded;
    case 'purged':
      return WalletStatus.Purged;
    default:
      return WalletStatus.Empty;
  }
}

/**
 * Parse supported curves from data
 */
export function parseSupportedCurves(
  curves?: string[],
  generation?: CardGeneration,
): EllipticCurve[] {
  if (curves && curves.length > 0) {
    return curves.map((c) => c as EllipticCurve);
  }
  if (generation) {
    return generation.supportedCurves.map((c) => c as EllipticCurve);
  }
  return [EllipticCurve.Secp256k1];
}

/**
 * Parse wallet info from raw data
 */
export function parseWalletInfo(rawData: Record<string, unknown>): WalletInfo {
  return {
    publicKey: String(rawData.publicKey || ''),
    curve: (rawData.curve as EllipticCurve) || EllipticCurve.Secp256k1,
    status: parseWalletStatus(rawData.status as string | undefined),
    index: Number(rawData.index || 0),
    totalSignedHashes: rawData.totalSignedHashes as number | undefined,
    remainingSignatures: rawData.remainingSignatures as number | undefined,
    isHD: Boolean(rawData.isHD),
    derivedKeys: rawData.derivedKeys as DerivedKeyInfo[] | undefined,
  };
}

/**
 * Check if card supports a specific blockchain
 */
export function cardSupportsBlockchain(cardInfo: CardInfo, blockchain: string): boolean {
  const requiredCurve = getCurveForBlockchain(blockchain);
  return cardInfo.supportedCurves.includes(requiredCurve);
}

/**
 * Get recommended curve for card and blockchain
 */
export function getRecommendedCurve(cardInfo: CardInfo, blockchain: string): EllipticCurve | null {
  const requiredCurve = getCurveForBlockchain(blockchain);
  if (cardInfo.supportedCurves.includes(requiredCurve)) {
    return requiredCurve;
  }
  return null;
}

/**
 * Check if card can create more wallets
 */
export function canCreateWallet(cardInfo: CardInfo): boolean {
  return cardInfo.walletCount < cardInfo.maxWallets;
}

/**
 * Get card display name
 */
export function getCardDisplayName(cardInfo: CardInfo): string {
  const productName = getProductByBatchId(cardInfo.batchId);
  return `${productName} (${formatCardIdShort(cardInfo.cardId)})`;
}

/**
 * Format card ID for short display
 */
export function formatCardIdShort(cardId: string): string {
  const cleaned = cardId.replace(/\s/g, '').toUpperCase();
  if (cleaned.length > 8) {
    return `${cleaned.slice(0, 4)}...${cleaned.slice(-4)}`;
  }
  return cleaned;
}

/**
 * Validate access code format
 */
export function isValidAccessCode(code: string): boolean {
  // Access code must be 4-32 alphanumeric characters
  return /^[A-Za-z0-9]{4,32}$/.test(code);
}

/**
 * Validate passcode format
 */
export function isValidPasscode(code: string): boolean {
  // Passcode must be 4-8 digits
  return /^\d{4,8}$/.test(code);
}

/**
 * Create default card settings for a card type
 */
export function createDefaultSettings(cardType: CardType): Partial<CardSettingsMask> {
  return DEFAULT_SETTINGS_MASKS[cardType] || {};
}

/**
 * Check if firmware supports a feature
 */
export function firmwareSupports(
  firmwareVersion: string,
  feature: 'hdWallet' | 'backup' | 'passcode' | 'attestation',
): boolean {
  const generation = getCardGeneration(firmwareVersion);
  if (!generation) {
    return false;
  }

  switch (feature) {
    case 'hdWallet':
      return generation.hdWalletSupport;
    case 'backup':
      return generation.backupSupport;
    case 'passcode':
      return generation.passcodeSupport;
    case 'attestation':
      return generation.attestationSupport;
    default:
      return false;
  }
}

/**
 * Compare firmware versions
 */
export function compareFirmwareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const v1 = parts1[i] || 0;
    const v2 = parts2[i] || 0;
    if (v1 > v2) {
      return 1;
    }
    if (v1 < v2) {
      return -1;
    }
  }

  return 0;
}

/**
 * Calculate card health score (0-100)
 */
export function calculateCardHealth(cardInfo: CardInfo): number {
  let score = 100;

  // Check status
  if (cardInfo.status === CardStatus.Purged) {
    score -= 50;
  }
  if (!cardInfo.isActivated) {
    score -= 20;
  }

  // Check backup status
  if (cardInfo.isBackupAllowed && !cardInfo.backupStatus?.isBackedUp) {
    score -= 15;
  }

  // Check security
  if (!cardInfo.hasAccessCode) {
    score -= 10;
  }

  // Check attestation
  if (cardInfo.attestation && !cardInfo.attestation.isValid) {
    score -= 25;
  }

  return Math.max(0, score);
}
