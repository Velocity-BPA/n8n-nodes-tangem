/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Backup utility functions for Tangem multi-card operations
 */

import { CardType } from '../constants/cardVersions';
import { CardInfo, BackupStatus } from './cardUtils';

/**
 * Backup process state
 */
export enum BackupProcessState {
  NotStarted = 'not_started',
  ReadingPrimary = 'reading_primary',
  LinkingBackup = 'linking_backup',
  WritingBackup = 'writing_backup',
  Verifying = 'verifying',
  Complete = 'complete',
  Failed = 'failed',
}

/**
 * Backup process result
 */
export interface BackupProcessResult {
  success: boolean;
  state: BackupProcessState;
  primaryCardId: string;
  backupCardIds: string[];
  error?: string;
  completedAt?: number;
}

/**
 * Card set information
 */
export interface CardSetInfo {
  primaryCard: CardInfo;
  backupCards: CardInfo[];
  totalCards: number;
  isComplete: boolean;
  setId: string;
}

/**
 * Backup card requirement
 */
export interface BackupRequirement {
  minBackupCards: number;
  maxBackupCards: number;
  requiredCardType: CardType;
}

/**
 * Get backup requirements for a card type
 */
export function getBackupRequirements(cardType: CardType): BackupRequirement {
  switch (cardType) {
    case CardType.Wallet2:
      return {
        minBackupCards: 1,
        maxBackupCards: 1,
        requiredCardType: CardType.Wallet2,
      };
    case CardType.Wallet3:
      return {
        minBackupCards: 1,
        maxBackupCards: 2,
        requiredCardType: CardType.Wallet3,
      };
    case CardType.Ring:
      return {
        minBackupCards: 1,
        maxBackupCards: 2,
        requiredCardType: CardType.Ring,
      };
    default:
      return {
        minBackupCards: 0,
        maxBackupCards: 0,
        requiredCardType: cardType,
      };
  }
}

/**
 * Check if a card can be used as primary
 */
export function canBeUsedAsPrimary(cardInfo: CardInfo): boolean {
  // Card must support backup
  if (!cardInfo.isBackupAllowed) {
    return false;
  }

  // Card must have at least one wallet
  if (cardInfo.walletCount === 0) {
    return false;
  }

  // Card must not already be a backup card
  if (cardInfo.backupStatus?.status === 'complete' && !isPrimaryCard(cardInfo)) {
    return false;
  }

  return true;
}

/**
 * Check if a card can be used as backup
 */
export function canBeUsedAsBackup(cardInfo: CardInfo, primaryCardInfo?: CardInfo): boolean {
  // Card must support backup
  if (!cardInfo.isBackupAllowed) {
    return false;
  }

  // Card must be empty (no wallets)
  if (cardInfo.walletCount > 0) {
    return false;
  }

  // If primary card is provided, check compatibility
  if (primaryCardInfo) {
    // Same card type required
    if (cardInfo.cardType !== primaryCardInfo.cardType) {
      return false;
    }

    // Cannot backup to itself
    if (cardInfo.cardId === primaryCardInfo.cardId) {
      return false;
    }

    // Check firmware compatibility
    if (!areFirmwareCompatible(cardInfo.firmwareVersion, primaryCardInfo.firmwareVersion)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a card is the primary card in a set
 */
export function isPrimaryCard(cardInfo: CardInfo): boolean {
  return cardInfo.backupStatus?.primaryCardId === cardInfo.cardId;
}

/**
 * Check if firmware versions are compatible for backup
 */
export function areFirmwareCompatible(version1: string, version2: string): boolean {
  // Major version must match
  const major1 = version1.split('.')[0];
  const major2 = version2.split('.')[0];
  return major1 === major2;
}

/**
 * Validate backup card set
 */
export function validateBackupSet(
  primaryCard: CardInfo,
  backupCards: CardInfo[],
): { valid: boolean; error?: string } {
  const requirements = getBackupRequirements(primaryCard.cardType);

  if (!canBeUsedAsPrimary(primaryCard)) {
    return { valid: false, error: 'Primary card cannot be used for backup' };
  }

  if (backupCards.length < requirements.minBackupCards) {
    return {
      valid: false,
      error: `At least ${requirements.minBackupCards} backup card(s) required`,
    };
  }

  if (backupCards.length > requirements.maxBackupCards) {
    return {
      valid: false,
      error: `Maximum ${requirements.maxBackupCards} backup card(s) allowed`,
    };
  }

  for (let i = 0; i < backupCards.length; i++) {
    if (!canBeUsedAsBackup(backupCards[i], primaryCard)) {
      return {
        valid: false,
        error: `Backup card ${i + 1} is not compatible`,
      };
    }
  }

  // Check for duplicate cards
  const allCardIds = [primaryCard.cardId, ...backupCards.map((c) => c.cardId)];
  const uniqueIds = new Set(allCardIds);
  if (uniqueIds.size !== allCardIds.length) {
    return { valid: false, error: 'Duplicate cards detected' };
  }

  return { valid: true };
}

/**
 * Create backup process result
 */
export function createBackupResult(
  success: boolean,
  state: BackupProcessState,
  primaryCardId: string,
  backupCardIds: string[],
  error?: string,
): BackupProcessResult {
  return {
    success,
    state,
    primaryCardId,
    backupCardIds,
    error,
    completedAt: success ? Date.now() : undefined,
  };
}

/**
 * Parse backup status from raw data
 */
export function parseBackupStatus(rawData: Record<string, unknown>): BackupStatus {
  return {
    isBackedUp: Boolean(rawData.isBackedUp),
    backupCardCount: Number(rawData.backupCardCount || 0),
    primaryCardId: rawData.primaryCardId as string | undefined,
    backupCardIds: (rawData.backupCardIds as string[]) || [],
    status: parseBackupState(rawData.status as string | undefined),
  };
}

/**
 * Parse backup state string
 */
function parseBackupState(stateStr?: string): 'none' | 'inProgress' | 'complete' {
  switch (stateStr?.toLowerCase()) {
    case 'inprogress':
    case 'in_progress':
      return 'inProgress';
    case 'complete':
    case 'completed':
      return 'complete';
    default:
      return 'none';
  }
}

/**
 * Get backup progress percentage
 */
export function getBackupProgress(state: BackupProcessState, currentStep: number, totalSteps: number): number {
  switch (state) {
    case BackupProcessState.NotStarted:
      return 0;
    case BackupProcessState.ReadingPrimary:
      return 10;
    case BackupProcessState.LinkingBackup:
      return 20 + (currentStep / totalSteps) * 30;
    case BackupProcessState.WritingBackup:
      return 50 + (currentStep / totalSteps) * 30;
    case BackupProcessState.Verifying:
      return 80 + (currentStep / totalSteps) * 15;
    case BackupProcessState.Complete:
      return 100;
    case BackupProcessState.Failed:
      return 0;
    default:
      return 0;
  }
}

/**
 * Generate card set ID
 */
export function generateCardSetId(primaryCardId: string, backupCardIds: string[]): string {
  const allIds = [primaryCardId, ...backupCardIds.sort()];
  const combined = allIds.join('-');
  // Simple hash for set ID
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return `set-${Math.abs(hash).toString(16)}`;
}

/**
 * Create card set info
 */
export function createCardSetInfo(
  primaryCard: CardInfo,
  backupCards: CardInfo[],
): CardSetInfo {
  const backupCardIds = backupCards.map((c) => c.cardId);
  return {
    primaryCard,
    backupCards,
    totalCards: 1 + backupCards.length,
    isComplete: validateBackupSet(primaryCard, backupCards).valid,
    setId: generateCardSetId(primaryCard.cardId, backupCardIds),
  };
}

/**
 * Instructions for backup process
 */
export interface BackupInstructions {
  step: number;
  totalSteps: number;
  action: string;
  cardToTap: 'primary' | 'backup';
  backupCardIndex?: number;
}

/**
 * Get next backup instruction
 */
export function getNextBackupInstruction(
  state: BackupProcessState,
  backupCardCount: number,
  currentBackupIndex: number = 0,
): BackupInstructions | null {
  const totalBackupSteps = backupCardCount * 2 + 2; // Read primary, link each backup, write each backup, verify

  switch (state) {
    case BackupProcessState.NotStarted:
      return {
        step: 1,
        totalSteps: totalBackupSteps,
        action: 'Tap your primary Tangem card to start backup',
        cardToTap: 'primary',
      };
    case BackupProcessState.ReadingPrimary:
      return {
        step: 1,
        totalSteps: totalBackupSteps,
        action: 'Reading primary card...',
        cardToTap: 'primary',
      };
    case BackupProcessState.LinkingBackup:
      return {
        step: 2 + currentBackupIndex,
        totalSteps: totalBackupSteps,
        action: `Tap backup card ${currentBackupIndex + 1} to link`,
        cardToTap: 'backup',
        backupCardIndex: currentBackupIndex,
      };
    case BackupProcessState.WritingBackup:
      return {
        step: 2 + backupCardCount + currentBackupIndex,
        totalSteps: totalBackupSteps,
        action: `Tap backup card ${currentBackupIndex + 1} to write wallet data`,
        cardToTap: 'backup',
        backupCardIndex: currentBackupIndex,
      };
    case BackupProcessState.Verifying:
      return {
        step: totalBackupSteps - 1,
        totalSteps: totalBackupSteps,
        action: 'Verifying backup...',
        cardToTap: 'primary',
      };
    case BackupProcessState.Complete:
    case BackupProcessState.Failed:
      return null;
    default:
      return null;
  }
}
