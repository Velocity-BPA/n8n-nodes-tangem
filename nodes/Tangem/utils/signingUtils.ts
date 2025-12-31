/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Signing utility functions for Tangem card operations
 */

import { EllipticCurve, CURVE_INFO } from '../constants/curves';

/**
 * Signature format types
 */
export enum SignatureFormat {
  Raw = 'raw',
  DER = 'der',
  Compact = 'compact',
  CompactRecoverable = 'compact_recoverable',
}

/**
 * Signature structure
 */
export interface Signature {
  r: string;
  s: string;
  v?: number;
  raw: string;
  format: SignatureFormat;
}

/**
 * Sign request structure
 */
export interface SignRequest {
  hash?: string;
  data?: string;
  walletPublicKey: string;
  derivationPath?: string;
  curve?: EllipticCurve;
}

/**
 * Sign result structure
 */
export interface SignResult {
  signature: Signature;
  publicKey: string;
  hash: string;
  signedAt: number;
}

/**
 * Typed data (EIP-712) domain
 */
export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

/**
 * Typed data (EIP-712) structure
 */
export interface TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: TypedDataDomain;
  message: Record<string, unknown>;
}

/**
 * Validate hash format
 */
export function isValidHash(hash: string, expectedLength: number = 32): boolean {
  const cleaned = hash.replace(/^0x/, '');
  return /^[a-fA-F0-9]+$/.test(cleaned) && cleaned.length === expectedLength * 2;
}

/**
 * Normalize hash (add 0x prefix, lowercase)
 */
export function normalizeHash(hash: string): string {
  const cleaned = hash.replace(/^0x/, '').toLowerCase();
  return `0x${cleaned}`;
}

/**
 * Parse signature from raw bytes
 */
export function parseSignature(rawSignature: string, format: SignatureFormat = SignatureFormat.Raw): Signature {
  const cleaned = rawSignature.replace(/^0x/, '');

  let r: string;
  let s: string;
  let v: number | undefined;

  switch (format) {
    case SignatureFormat.DER:
      // Parse DER encoded signature
      const derParsed = parseDerSignature(cleaned);
      r = derParsed.r;
      s = derParsed.s;
      break;

    case SignatureFormat.CompactRecoverable:
      // 65 bytes: r (32) + s (32) + v (1)
      r = cleaned.slice(0, 64);
      s = cleaned.slice(64, 128);
      v = parseInt(cleaned.slice(128, 130), 16);
      break;

    case SignatureFormat.Compact:
    case SignatureFormat.Raw:
    default:
      // 64 bytes: r (32) + s (32)
      r = cleaned.slice(0, 64);
      s = cleaned.slice(64, 128);
      break;
  }

  return {
    r: `0x${r}`,
    s: `0x${s}`,
    v,
    raw: `0x${cleaned}`,
    format,
  };
}

/**
 * Parse DER encoded signature
 */
function parseDerSignature(hex: string): { r: string; s: string } {
  let offset = 0;

  // Skip sequence tag and length
  if (hex.slice(offset, offset + 2) === '30') {
    offset += 2;
    const seqLength = parseInt(hex.slice(offset, offset + 2), 16);
    offset += 2;
  }

  // Parse r
  if (hex.slice(offset, offset + 2) === '02') {
    offset += 2;
    let rLength = parseInt(hex.slice(offset, offset + 2), 16);
    offset += 2;
    let r = hex.slice(offset, offset + rLength * 2);
    offset += rLength * 2;

    // Remove leading zeros
    while (r.length > 64 && r.startsWith('00')) {
      r = r.slice(2);
    }
    r = r.padStart(64, '0');

    // Parse s
    if (hex.slice(offset, offset + 2) === '02') {
      offset += 2;
      let sLength = parseInt(hex.slice(offset, offset + 2), 16);
      offset += 2;
      let s = hex.slice(offset, offset + sLength * 2);

      // Remove leading zeros
      while (s.length > 64 && s.startsWith('00')) {
        s = s.slice(2);
      }
      s = s.padStart(64, '0');

      return { r, s };
    }
  }

  throw new Error('Invalid DER signature format');
}

/**
 * Encode signature to DER format
 */
export function encodeDerSignature(r: string, s: string): string {
  const rClean = r.replace(/^0x/, '').replace(/^00+/, '');
  const sClean = s.replace(/^0x/, '').replace(/^00+/, '');

  // Add leading zero if high bit is set
  const rPadded = parseInt(rClean[0], 16) >= 8 ? '00' + rClean : rClean;
  const sPadded = parseInt(sClean[0], 16) >= 8 ? '00' + sClean : sClean;

  const rLen = (rPadded.length / 2).toString(16).padStart(2, '0');
  const sLen = (sPadded.length / 2).toString(16).padStart(2, '0');

  const innerLen = ((rPadded.length + sPadded.length) / 2 + 4).toString(16).padStart(2, '0');

  return `30${innerLen}02${rLen}${rPadded}02${sLen}${sPadded}`;
}

/**
 * Encode signature to compact format
 */
export function encodeCompactSignature(signature: Signature, recoveryId?: number): string {
  const r = signature.r.replace(/^0x/, '').padStart(64, '0');
  const s = signature.s.replace(/^0x/, '').padStart(64, '0');

  if (recoveryId !== undefined) {
    const v = (recoveryId + 27).toString(16).padStart(2, '0');
    return `0x${r}${s}${v}`;
  }

  return `0x${r}${s}`;
}

/**
 * Calculate Ethereum signature v value
 */
export function calculateEthereumV(recoveryId: number, chainId?: number): number {
  if (chainId === undefined) {
    return recoveryId + 27;
  }
  // EIP-155
  return recoveryId + chainId * 2 + 35;
}

/**
 * Extract recovery ID from Ethereum v value
 */
export function extractRecoveryId(v: number, chainId?: number): number {
  if (v === 0 || v === 1) {
    return v;
  }
  if (v === 27 || v === 28) {
    return v - 27;
  }
  if (chainId !== undefined) {
    return v - chainId * 2 - 35;
  }
  return v - 27;
}

/**
 * Verify signature length matches curve
 */
export function isValidSignatureLength(signature: string, curve: EllipticCurve): boolean {
  const cleaned = signature.replace(/^0x/, '');
  const expectedLength = CURVE_INFO[curve].signatureSize * 2;

  // Allow for recovery byte (65 bytes for secp256k1)
  return cleaned.length === expectedLength || cleaned.length === expectedLength + 2;
}

/**
 * Hash typed data (EIP-712) - simplified
 */
export function hashTypedData(typedData: TypedData): string {
  // This is a simplified implementation
  // In production, use ethers.js or a proper EIP-712 implementation
  const json = JSON.stringify(typedData);
  return computeKeccak256(json);
}

/**
 * Compute keccak256 hash (placeholder)
 */
export function computeKeccak256(data: string): string {
  // This should use a proper keccak256 implementation
  // Using ethers.js or similar library
  // Placeholder implementation
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  let hash = 0;
  for (const byte of bytes) {
    hash = ((hash << 5) - hash + byte) | 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

/**
 * Compute SHA-256 hash (placeholder)
 */
export function computeSha256(data: string): string {
  // This should use a proper SHA-256 implementation
  // Placeholder implementation
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  let hash = 0;
  for (const byte of bytes) {
    hash = ((hash << 5) - hash + byte) | 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

/**
 * Sign request validator
 */
export function validateSignRequest(request: SignRequest): { valid: boolean; error?: string } {
  if (!request.hash && !request.data) {
    return { valid: false, error: 'Either hash or data must be provided' };
  }

  if (request.hash && !isValidHash(request.hash)) {
    return { valid: false, error: 'Invalid hash format' };
  }

  if (!request.walletPublicKey) {
    return { valid: false, error: 'Wallet public key is required' };
  }

  return { valid: true };
}

/**
 * Create sign result
 */
export function createSignResult(
  signature: Signature,
  publicKey: string,
  hash: string,
): SignResult {
  return {
    signature,
    publicKey,
    hash: normalizeHash(hash),
    signedAt: Date.now(),
  };
}

/**
 * Batch signing request
 */
export interface BatchSignRequest {
  hashes: string[];
  walletPublicKey: string;
  derivationPath?: string;
}

/**
 * Batch signing result
 */
export interface BatchSignResult {
  signatures: Signature[];
  publicKey: string;
  hashes: string[];
  signedAt: number;
}

/**
 * Validate batch sign request
 */
export function validateBatchSignRequest(request: BatchSignRequest): { valid: boolean; error?: string } {
  if (!request.hashes || request.hashes.length === 0) {
    return { valid: false, error: 'At least one hash is required' };
  }

  if (request.hashes.length > 10) {
    return { valid: false, error: 'Maximum 10 hashes can be signed at once' };
  }

  for (const hash of request.hashes) {
    if (!isValidHash(hash)) {
      return { valid: false, error: `Invalid hash format: ${hash}` };
    }
  }

  if (!request.walletPublicKey) {
    return { valid: false, error: 'Wallet public key is required' };
  }

  return { valid: true };
}
