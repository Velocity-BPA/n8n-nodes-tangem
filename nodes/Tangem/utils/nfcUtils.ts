/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * NFC utility functions for Tangem card interactions
 */

import { TangemErrorCode, getErrorMessage, NfcEvent } from '../constants/events';

/**
 * NFC session configuration
 */
export interface NfcSessionConfig {
  timeout: number;
  retryAttempts: number;
  useSoundFeedback: boolean;
  alertMessage?: string;
}

/**
 * Default NFC session configuration
 */
export const DEFAULT_NFC_CONFIG: NfcSessionConfig = {
  timeout: 30000,
  retryAttempts: 3,
  useSoundFeedback: true,
  alertMessage: 'Hold your Tangem card near the device',
};

/**
 * NFC operation result
 */
export interface NfcOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: TangemErrorCode;
    message: string;
  };
  duration: number;
}

/**
 * NFC session state
 */
export interface NfcSessionState {
  isActive: boolean;
  startTime?: number;
  lastEvent?: NfcEvent;
  cardId?: string;
}

/**
 * Create a new NFC operation result
 */
export function createNfcResult<T>(
  success: boolean,
  data?: T,
  errorCode?: TangemErrorCode,
  startTime: number = Date.now(),
): NfcOperationResult<T> {
  const result: NfcOperationResult<T> = {
    success,
    duration: Date.now() - startTime,
  };

  if (success && data !== undefined) {
    result.data = data;
  }

  if (!success && errorCode) {
    result.error = {
      code: errorCode,
      message: getErrorMessage(errorCode),
    };
  }

  return result;
}

/**
 * Validate NFC session configuration
 */
export function validateNfcConfig(config: Partial<NfcSessionConfig>): NfcSessionConfig {
  return {
    timeout: Math.max(1000, Math.min(config.timeout ?? DEFAULT_NFC_CONFIG.timeout, 120000)),
    retryAttempts: Math.max(1, Math.min(config.retryAttempts ?? DEFAULT_NFC_CONFIG.retryAttempts, 10)),
    useSoundFeedback: config.useSoundFeedback ?? DEFAULT_NFC_CONFIG.useSoundFeedback,
    alertMessage: config.alertMessage ?? DEFAULT_NFC_CONFIG.alertMessage,
  };
}

/**
 * Format Card ID for display
 */
export function formatCardId(cardId: string): string {
  // Format as XXXX XXXX XXXX XXXX
  const cleaned = cardId.replace(/\s/g, '').toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned;
}

/**
 * Parse Card ID from formatted string
 */
export function parseCardId(formattedCardId: string): string {
  return formattedCardId.replace(/\s/g, '').toUpperCase();
}

/**
 * Validate Card ID format
 */
export function isValidCardId(cardId: string): boolean {
  const cleaned = parseCardId(cardId);
  // Tangem CID is typically 16-32 hex characters
  return /^[A-F0-9]{16,32}$/i.test(cleaned);
}

/**
 * NFC command types
 */
export enum NfcCommand {
  ScanCard = 'scan_card',
  ReadCard = 'read_card',
  WriteCard = 'write_card',
  Sign = 'sign',
  CreateWallet = 'create_wallet',
  PurgeWallet = 'purge_wallet',
  SetAccessCode = 'set_access_code',
  SetPasscode = 'set_passcode',
  Attest = 'attest',
  Backup = 'backup',
}

/**
 * Build NFC APDU command
 */
export interface ApduCommand {
  cla: number;
  ins: number;
  p1: number;
  p2: number;
  data?: Uint8Array;
  le?: number;
}

/**
 * APDU response structure
 */
export interface ApduResponse {
  data: Uint8Array;
  sw1: number;
  sw2: number;
}

/**
 * Check if APDU response indicates success
 */
export function isApduSuccess(response: ApduResponse): boolean {
  return response.sw1 === 0x90 && response.sw2 === 0x00;
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a timeout promise
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Wrap an operation with timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string,
): Promise<T> {
  return Promise.race([
    operation,
    createTimeout(timeoutMs, timeoutMessage),
  ]);
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * NFC session event emitter type
 */
export type NfcEventHandler = (event: NfcEvent, data?: unknown) => void;

/**
 * Create NFC session state manager
 */
export function createSessionState(): NfcSessionState {
  return {
    isActive: false,
  };
}

/**
 * Update session state
 */
export function updateSessionState(
  state: NfcSessionState,
  event: NfcEvent,
  cardId?: string,
): NfcSessionState {
  return {
    ...state,
    lastEvent: event,
    cardId: cardId ?? state.cardId,
    isActive: event !== NfcEvent.SessionEnded && event !== NfcEvent.NfcError,
    startTime: event === NfcEvent.SessionStarted ? Date.now() : state.startTime,
  };
}
