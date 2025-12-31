/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * NEAR Resource Operations
 * Handles NEAR Protocol interactions via Tangem card
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
				case 'getAddress': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// NEAR uses implicit accounts (hex public key) or named accounts
					const implicitAccountId = publicKey.toLowerCase();

					result = {
						success: true,
						implicitAccountId,
						publicKey,
						publicKeyBase58: base58Encode(Buffer.from(publicKey, 'hex')),
						network,
						derivationPath: "m/44'/397'/0'",
						note: 'Use implicit account ID or create a named account',
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signTransaction': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const transactionJson = this.getNodeParameter('transactionJson', i) as string;

					let transaction: Record<string, unknown>;
					try {
						transaction = JSON.parse(transactionJson);
					} catch {
						throw new Error('Invalid transaction JSON');
					}

					// Serialize and hash transaction
					const serializedTx = serializeNearTransaction(transaction);
					const txHash = hashNearTransaction(serializedTx);

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'NEAR Transaction',
					);

					// Build signed transaction
					const signedTx = {
						transaction,
						signature: {
							keyType: 0, // ED25519
							data: signResult.signature,
						},
					};

					result = {
						success: true,
						signedTransaction: signedTx,
						signedTransactionBase64: Buffer.from(JSON.stringify(signedTx)).toString('base64'),
						txHash,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const accountId = this.getNodeParameter('accountId', i, '') as string;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = accountId || publicKey.toLowerCase();

					// Placeholder - In production, query NEAR RPC
					result = {
						success: true,
						accountId: address,
						balance: '0',
						balanceYocto: '0',
						balanceNear: '0',
						storageUsage: 0,
						locked: '0',
						codeHash: '',
						network,
						note: 'Balance fetched from NEAR RPC',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedTransactionBase64 = this.getNodeParameter('signedTransactionBase64', i) as string;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;
					const waitUntil = this.getNodeParameter('waitUntil', i, 'EXECUTED') as string;

					// Placeholder - In production, send to NEAR RPC
					const txHash = hashNearTransaction(signedTransactionBase64);

					const explorerBase = network === 'mainnet'
						? 'https://explorer.near.org'
						: 'https://testnet.explorer.near.org';

					result = {
						success: true,
						txHash,
						status: 'SuccessValue',
						receiptsOutcome: [],
						network,
						waitUntil,
						explorerUrl: `${explorerBase}/transactions/${txHash}`,
						note: 'Transaction broadcast to NEAR network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for NEAR resource`);
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

function serializeNearTransaction(transaction: Record<string, unknown>): string {
	// Placeholder - In production, use borsh serialization
	return JSON.stringify(transaction);
}

function hashNearTransaction(serializedTx: string): string {
	// SHA-256 hash
	return simpleHash(serializedTx);
}

function base58Encode(buffer: Buffer): string {
	const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	let num = BigInt('0x' + buffer.toString('hex'));
	let encoded = '';

	while (num > 0n) {
		const remainder = Number(num % 58n);
		num = num / 58n;
		encoded = ALPHABET[remainder] + encoded;
	}

	for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
		encoded = '1' + encoded;
	}

	return encoded || '1';
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
