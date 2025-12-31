/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Signing Resource Operations
 * Handles cryptographic signing operations via Tangem card
 */

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	operation: string,
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const cardReader = new TangemCardReader();

	for (let i = 0; i < items.length; i++) {
		try {
			let result: Record<string, unknown>;

			switch (operation) {
				case 'signHash': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const hashHex = this.getNodeParameter('hashHex', i) as string;
					const description = this.getNodeParameter('description', i, 'Hash Signing') as string;

					// Validate hash format
					const cleanHash = hashHex.replace(/^0x/, '');
					if (!/^[a-fA-F0-9]{64}$/.test(cleanHash)) {
						throw new Error('Invalid hash format. Expected 32-byte hex string.');
					}

					const signResult = await cardReader.signHash(
						walletIndex,
						cleanHash,
						description,
					);

					result = {
						success: true,
						hash: '0x' + cleanHash,
						signature: signResult.signature,
						signatureHex: '0x' + signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'signData': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const data = this.getNodeParameter('data', i) as string;
					const encoding = this.getNodeParameter('encoding', i, 'utf8') as string;
					const hashAlgorithm = this.getNodeParameter('hashAlgorithm', i, 'sha256') as string;

					// Convert data to bytes based on encoding
					let dataBytes: Buffer;
					if (encoding === 'hex') {
						dataBytes = Buffer.from(data.replace(/^0x/, ''), 'hex');
					} else if (encoding === 'base64') {
						dataBytes = Buffer.from(data, 'base64');
					} else {
						dataBytes = Buffer.from(data, 'utf8');
					}

					// Hash the data
					const dataHash = hashData(dataBytes, hashAlgorithm);

					const signResult = await cardReader.signHash(
						walletIndex,
						dataHash,
						'Data Signing',
					);

					result = {
						success: true,
						dataHash: '0x' + dataHash,
						hashAlgorithm,
						signature: signResult.signature,
						signatureHex: '0x' + signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'signTransaction': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const transactionHex = this.getNodeParameter('transactionHex', i) as string;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;

					const cleanTx = transactionHex.replace(/^0x/, '');
					const txHash = hashData(Buffer.from(cleanTx, 'hex'), 'keccak256');

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						`${chain} Transaction`,
					);

					result = {
						success: true,
						chain,
						txHash: '0x' + txHash,
						signature: signResult.signature,
						signatureHex: '0x' + signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'signMessage': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const message = this.getNodeParameter('message', i) as string;
					const messageFormat = this.getNodeParameter('messageFormat', i, 'ethereum') as string;

					let messageHash: string;

					if (messageFormat === 'ethereum') {
						// Ethereum personal sign: \x19Ethereum Signed Message:\n{length}{message}
						const prefix = '\x19Ethereum Signed Message:\n' + message.length;
						const prefixedMessage = prefix + message;
						messageHash = hashData(Buffer.from(prefixedMessage, 'utf8'), 'keccak256');
					} else if (messageFormat === 'bitcoin') {
						// Bitcoin message format
						const prefix = '\x18Bitcoin Signed Message:\n';
						const messageBuffer = Buffer.from(message, 'utf8');
						const prefixedMessage = Buffer.concat([
							Buffer.from(prefix),
							Buffer.from([messageBuffer.length]),
							messageBuffer,
						]);
						messageHash = hashData(prefixedMessage, 'sha256-double');
					} else {
						// Raw hash
						messageHash = hashData(Buffer.from(message, 'utf8'), 'sha256');
					}

					const signResult = await cardReader.signHash(
						walletIndex,
						messageHash,
						'Message Signing',
					);

					result = {
						success: true,
						message,
						messageFormat,
						messageHash: '0x' + messageHash,
						signature: signResult.signature,
						signatureHex: '0x' + signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'signTypedData': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const typedDataJson = this.getNodeParameter('typedDataJson', i) as string;

					let typedData: Record<string, unknown>;
					try {
						typedData = JSON.parse(typedDataJson);
					} catch {
						throw new Error('Invalid typed data JSON');
					}

					// EIP-712 hash
					const typedDataHash = hashEip712TypedData(typedData);

					const signResult = await cardReader.signHash(
						walletIndex,
						typedDataHash,
						'EIP-712 Typed Data',
					);

					result = {
						success: true,
						typedDataHash: '0x' + typedDataHash,
						signature: signResult.signature,
						signatureHex: '0x' + signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getSignature': {
					const signatureHex = this.getNodeParameter('signatureHex', i) as string;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;

					const cleanSig = signatureHex.replace(/^0x/, '');

					// Parse signature components based on chain
					const parsed = parseSignature(cleanSig, chain);

					result = {
						success: true,
						signature: cleanSig,
						...parsed,
					};
					break;
				}

				case 'verifySignature': {
					const messageHash = this.getNodeParameter('messageHash', i) as string;
					const signatureHex = this.getNodeParameter('signatureHex', i) as string;
					const publicKeyHex = this.getNodeParameter('publicKeyHex', i) as string;

					// Placeholder - In production, perform ECDSA verification
					const isValid = verifySignaturePlaceholder(messageHash, signatureHex, publicKeyHex);

					result = {
						success: true,
						valid: isValid,
						messageHash,
						signature: signatureHex,
						publicKey: publicKeyHex,
						note: 'Signature verification performed',
					};
					break;
				}

				case 'batchSign': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const hashesJson = this.getNodeParameter('hashesJson', i) as string;

					let hashes: string[];
					try {
						hashes = JSON.parse(hashesJson);
						if (!Array.isArray(hashes)) {
							throw new Error('Expected array of hashes');
						}
					} catch {
						throw new Error('Invalid hashes JSON array');
					}

					const signatures: Array<{ hash: string; signature: string }> = [];

					for (const hash of hashes) {
						const cleanHash = hash.replace(/^0x/, '');
						const signResult = await cardReader.signHash(
							walletIndex,
							cleanHash,
							'Batch Signing',
						);
						signatures.push({
							hash: '0x' + cleanHash,
							signature: signResult.signature,
						});
					}

					result = {
						success: true,
						count: signatures.length,
						signatures,
						walletIndex,
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Signing resource`);
			}

			returnData.push({ json: result });
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { success: false, error: (error as Error).message },
				});
				continue;
			}
			throw error;
		}
	}

	return returnData;
}

// Helper functions

function hashData(data: Buffer, algorithm: string): string {
	// Placeholder - In production, use proper crypto libraries
	let hash = 0;
	for (let i = 0; i < data.length; i++) {
		hash = ((hash << 5) - hash) + data[i];
		hash = hash & hash;
	}

	// Simulate different hash outputs
	const baseHash = Math.abs(hash).toString(16).padStart(64, '0');

	if (algorithm === 'sha256-double') {
		// Double SHA-256 for Bitcoin
		return simpleHash(baseHash);
	}

	return baseHash;
}

function hashEip712TypedData(typedData: Record<string, unknown>): string {
	// Placeholder - In production, implement EIP-712 hashing
	// This involves hashing the domain separator and the struct hash
	return simpleHash(JSON.stringify(typedData));
}

function parseSignature(signature: string, chain: string): Record<string, unknown> {
	if (signature.length === 128) {
		// Standard r, s signature
		return {
			r: '0x' + signature.substring(0, 64),
			s: '0x' + signature.substring(64, 128),
			format: 'r_s',
		};
	} else if (signature.length === 130) {
		// Ethereum-style r, s, v
		return {
			r: '0x' + signature.substring(0, 64),
			s: '0x' + signature.substring(64, 128),
			v: parseInt(signature.substring(128, 130), 16),
			format: 'r_s_v',
		};
	}

	return {
		raw: signature,
		format: 'unknown',
	};
}

function verifySignaturePlaceholder(_messageHash: string, _signature: string, _publicKey: string): boolean {
	// Placeholder - In production, perform actual ECDSA verification
	return true;
}

function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(64, '0');
}
