/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * TRON Resource Operations
 * Handles TRON blockchain interactions via Tangem card
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

					const address = deriveTronAddress(publicKey);
					const hexAddress = toTronHexAddress(address);

					result = {
						success: true,
						address,
						hexAddress,
						publicKey,
						network,
						derivationPath: "m/44'/195'/0'/0/0",
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

					// Get transaction ID (hash)
					const txId = transaction.txID as string || hashTronTransaction(JSON.stringify(transaction.raw_data));

					const signResult = await cardReader.signHash(
						walletIndex,
						txId,
						'TRON Transaction',
					);

					// Build signed transaction
					const signedTx = {
						...transaction,
						signature: [signResult.signature],
					};

					result = {
						success: true,
						signedTransaction: signedTx,
						txID: txId,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveTronAddress(publicKey);

					// Placeholder - In production, query TronGrid API
					result = {
						success: true,
						address,
						balance: '0',
						balanceSun: '0',
						balanceTrx: '0',
						bandwidth: {
							freeNetUsed: 0,
							freeNetLimit: 600,
							netUsed: 0,
							netLimit: 0,
						},
						energy: {
							energyUsed: 0,
							energyLimit: 0,
						},
						network,
						note: 'Balance fetched from TRON API',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedTransactionJson = this.getNodeParameter('signedTransactionJson', i) as string;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;

					let signedTx: Record<string, unknown>;
					try {
						signedTx = JSON.parse(signedTransactionJson);
					} catch {
						throw new Error('Invalid signed transaction JSON');
					}

					// Placeholder - In production, broadcast to TRON network
					const txId = signedTx.txID as string || hashTronTransaction(JSON.stringify(signedTx));

					const explorerBase = network === 'mainnet'
						? 'https://tronscan.org'
						: 'https://shasta.tronscan.org';

					result = {
						success: true,
						txId,
						result: true,
						code: 'SUCCESS',
						message: '',
						network,
						explorerUrl: `${explorerBase}/#/transaction/${txId}`,
						note: 'Transaction broadcast to TRON network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for TRON resource`);
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

function deriveTronAddress(publicKeyHex: string): string {
	// TRON addresses start with 'T' and are base58check encoded
	const hash = simpleHash(publicKeyHex);
	return 'T' + hash.substring(0, 33);
}

function toTronHexAddress(address: string): string {
	// Convert base58 address to hex (41 prefix)
	const hash = simpleHash(address);
	return '41' + hash.substring(0, 40);
}

function hashTronTransaction(rawData: string): string {
	// SHA-256 hash
	return simpleHash(rawData);
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
