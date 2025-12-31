/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Event types for Tangem card operations
 */

/**
 * NFC event types
 */
export enum NfcEvent {
  CardTapped = 'card_tapped',
  CardReadComplete = 'card_read_complete',
  CardWriteComplete = 'card_write_complete',
  CardRemoved = 'card_removed',
  NfcError = 'nfc_error',
  SessionStarted = 'session_started',
  SessionEnded = 'session_ended',
  TagDiscovered = 'tag_discovered',
  TagLost = 'tag_lost',
}

/**
 * Signing event types
 */
export enum SigningEvent {
  SignRequest = 'sign_request',
  SignatureComplete = 'signature_complete',
  SigningCancelled = 'signing_cancelled',
  SigningError = 'signing_error',
  HashSigned = 'hash_signed',
  MessageSigned = 'message_signed',
  TransactionSigned = 'transaction_signed',
  BatchSignComplete = 'batch_sign_complete',
}

/**
 * Transaction event types
 */
export enum TransactionEvent {
  TransactionCreated = 'transaction_created',
  TransactionSigned = 'transaction_signed',
  TransactionBroadcast = 'transaction_broadcast',
  TransactionConfirmed = 'transaction_confirmed',
  TransactionFailed = 'transaction_failed',
  TransactionPending = 'transaction_pending',
  TransactionDropped = 'transaction_dropped',
}

/**
 * Card event types
 */
export enum CardEvent {
  CardActivated = 'card_activated',
  CardDeactivated = 'card_deactivated',
  WalletCreated = 'wallet_created',
  WalletPurged = 'wallet_purged',
  WalletImported = 'wallet_imported',
  PinChanged = 'pin_changed',
  PasscodeChanged = 'passcode_changed',
  BackupCreated = 'backup_created',
  BackupVerified = 'backup_verified',
  SettingsChanged = 'settings_changed',
  FirmwareUpdated = 'firmware_updated',
}

/**
 * Security event types
 */
export enum SecurityEvent {
  AuthenticationRequired = 'authentication_required',
  AccessCodeRequired = 'access_code_required',
  PasscodeRequired = 'passcode_required',
  SecurityDelayActive = 'security_delay_active',
  SecurityDelayComplete = 'security_delay_complete',
  TamperingDetected = 'tampering_detected',
  AttestationVerified = 'attestation_verified',
  AttestationFailed = 'attestation_failed',
  CardLocked = 'card_locked',
  CardUnlocked = 'card_unlocked',
}

/**
 * Backup event types
 */
export enum BackupEvent {
  BackupStarted = 'backup_started',
  BackupInProgress = 'backup_in_progress',
  BackupComplete = 'backup_complete',
  BackupFailed = 'backup_failed',
  BackupCardLinked = 'backup_card_linked',
  BackupCardUnlinked = 'backup_card_unlinked',
  PrimaryCardRead = 'primary_card_read',
  BackupCardRead = 'backup_card_read',
}

/**
 * App integration event types
 */
export enum AppEvent {
  AppConnected = 'app_connected',
  AppDisconnected = 'app_disconnected',
  PortfolioSynced = 'portfolio_synced',
  TransactionsImported = 'transactions_imported',
  DataExported = 'data_exported',
}

/**
 * All event types combined
 */
export type TangemEvent =
  | NfcEvent
  | SigningEvent
  | TransactionEvent
  | CardEvent
  | SecurityEvent
  | BackupEvent
  | AppEvent;

/**
 * Event category mapping
 */
export const EVENT_CATEGORIES: Record<string, string[]> = {
  nfc: Object.values(NfcEvent),
  signing: Object.values(SigningEvent),
  transaction: Object.values(TransactionEvent),
  card: Object.values(CardEvent),
  security: Object.values(SecurityEvent),
  backup: Object.values(BackupEvent),
  app: Object.values(AppEvent),
};

/**
 * Event metadata interface
 */
export interface EventMetadata {
  event: TangemEvent;
  timestamp: number;
  cardId?: string;
  walletPublicKey?: string;
  data?: Record<string, unknown>;
}

/**
 * Error codes
 */
export enum TangemErrorCode {
  // NFC Errors (1xxx)
  NfcNotAvailable = 1001,
  NfcDisabled = 1002,
  NfcSessionTimeout = 1003,
  NfcTagLost = 1004,
  NfcConnectionFailed = 1005,
  NfcReadError = 1006,
  NfcWriteError = 1007,

  // Card Errors (2xxx)
  CardNotFound = 2001,
  CardNotSupported = 2002,
  CardNotActivated = 2003,
  CardLocked = 2004,
  CardPurged = 2005,
  CardBusy = 2006,
  CardInvalidState = 2007,

  // Wallet Errors (3xxx)
  WalletNotFound = 3001,
  WalletAlreadyExists = 3002,
  WalletEmpty = 3003,
  WalletNotSupported = 3004,
  MaxWalletsReached = 3005,

  // Signing Errors (4xxx)
  SigningFailed = 4001,
  SigningCancelled = 4002,
  SignatureInvalid = 4003,
  HashInvalid = 4004,
  DataTooLarge = 4005,

  // Authentication Errors (5xxx)
  AccessCodeRequired = 5001,
  AccessCodeInvalid = 5002,
  PasscodeRequired = 5003,
  PasscodeInvalid = 5004,
  AuthenticationFailed = 5005,

  // Backup Errors (6xxx)
  BackupFailed = 6001,
  BackupCardNotLinked = 6002,
  BackupNotSupported = 6003,
  BackupIncomplete = 6004,
  PrimaryCardRequired = 6005,

  // Network Errors (7xxx)
  NetworkError = 7001,
  NetworkTimeout = 7002,
  RpcError = 7003,
  BroadcastFailed = 7004,

  // General Errors (9xxx)
  UnknownError = 9001,
  InvalidParameter = 9002,
  OperationCancelled = 9003,
  NotSupported = 9004,
  InternalError = 9005,
}

/**
 * Error messages
 */
export const ERROR_MESSAGES: Record<TangemErrorCode, string> = {
  [TangemErrorCode.NfcNotAvailable]: 'NFC is not available on this device',
  [TangemErrorCode.NfcDisabled]: 'NFC is disabled. Please enable NFC in settings',
  [TangemErrorCode.NfcSessionTimeout]: 'NFC session timed out. Please try again',
  [TangemErrorCode.NfcTagLost]: 'Card connection lost. Please hold the card steady',
  [TangemErrorCode.NfcConnectionFailed]: 'Failed to connect to the card',
  [TangemErrorCode.NfcReadError]: 'Failed to read from the card',
  [TangemErrorCode.NfcWriteError]: 'Failed to write to the card',

  [TangemErrorCode.CardNotFound]: 'Card not found. Please tap your Tangem card',
  [TangemErrorCode.CardNotSupported]: 'This card type is not supported',
  [TangemErrorCode.CardNotActivated]: 'Card is not activated',
  [TangemErrorCode.CardLocked]: 'Card is locked. Please enter your access code',
  [TangemErrorCode.CardPurged]: 'Card has been purged and cannot be used',
  [TangemErrorCode.CardBusy]: 'Card is busy processing another operation',
  [TangemErrorCode.CardInvalidState]: 'Card is in an invalid state',

  [TangemErrorCode.WalletNotFound]: 'Wallet not found on the card',
  [TangemErrorCode.WalletAlreadyExists]: 'A wallet already exists on this card',
  [TangemErrorCode.WalletEmpty]: 'Wallet is empty',
  [TangemErrorCode.WalletNotSupported]: 'This wallet type is not supported',
  [TangemErrorCode.MaxWalletsReached]: 'Maximum number of wallets reached',

  [TangemErrorCode.SigningFailed]: 'Signing operation failed',
  [TangemErrorCode.SigningCancelled]: 'Signing was cancelled',
  [TangemErrorCode.SignatureInvalid]: 'Generated signature is invalid',
  [TangemErrorCode.HashInvalid]: 'Invalid hash provided for signing',
  [TangemErrorCode.DataTooLarge]: 'Data is too large to sign',

  [TangemErrorCode.AccessCodeRequired]: 'Access code is required',
  [TangemErrorCode.AccessCodeInvalid]: 'Invalid access code',
  [TangemErrorCode.PasscodeRequired]: 'Passcode is required',
  [TangemErrorCode.PasscodeInvalid]: 'Invalid passcode',
  [TangemErrorCode.AuthenticationFailed]: 'Authentication failed',

  [TangemErrorCode.BackupFailed]: 'Backup operation failed',
  [TangemErrorCode.BackupCardNotLinked]: 'Backup card is not linked',
  [TangemErrorCode.BackupNotSupported]: 'Backup is not supported on this card',
  [TangemErrorCode.BackupIncomplete]: 'Backup process is incomplete',
  [TangemErrorCode.PrimaryCardRequired]: 'Primary card is required for this operation',

  [TangemErrorCode.NetworkError]: 'Network error occurred',
  [TangemErrorCode.NetworkTimeout]: 'Network request timed out',
  [TangemErrorCode.RpcError]: 'RPC request failed',
  [TangemErrorCode.BroadcastFailed]: 'Failed to broadcast transaction',

  [TangemErrorCode.UnknownError]: 'An unknown error occurred',
  [TangemErrorCode.InvalidParameter]: 'Invalid parameter provided',
  [TangemErrorCode.OperationCancelled]: 'Operation was cancelled',
  [TangemErrorCode.NotSupported]: 'Operation is not supported',
  [TangemErrorCode.InternalError]: 'Internal error occurred',
};

/**
 * Get error message by code
 */
export function getErrorMessage(code: TangemErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[TangemErrorCode.UnknownError];
}
