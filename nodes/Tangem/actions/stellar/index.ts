/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Stellar Resource Operations
 * Handles Stellar network interactions via Tangem card
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
					const network = this.getNodeParameter('network', i, 'public') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveStellarAddress(publicKey);

					result = {
						success: true,
						address,
						publicKey,
						network,
						derivationPath: "m/44'/148'/0'",
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signTransaction': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const transactionXdr = this.getNodeParameter('transactionXdr', i) as string;
					const networkPassphrase = this.getNodeParameter('networkPassphrase', i, 'Public Global Stellar Network ; September 2015') as string;

					// Hash the transaction envelope with network passphrase
					const txHash = hashStellarTransaction(transactionXdr, networkPassphrase);

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'Stellar Transaction',
					);

					// Build signed transaction envelope
					const signedXdr = appendStellarSignature(transactionXdr, signResult.publicKey, signResult.signature);

					result = {
						success: true,
						signedTransactionXdr: signedXdr,
						txHash,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						networkPassphrase,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const network = this.getNodeParameter('network', i, 'public') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveStellarAddress(publicKey);

					// Placeholder - In production, query Stellar Horizon API
					result = {
						success: true,
						address,
						balances: [
							{
								asset_type: 'native',
								balance: '0',
								asset_code: 'XLM',
							},
						],
						sequence: '0',
						subentryCount: 0,
						inflationDestination: null,
						homeDomain: null,
						activated: false,
						network,
						note: 'Balance fetched from Stellar Horizon API',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedTransactionXdr = this.getNodeParameter('signedTransactionXdr', i) as string;
					const network = this.getNodeParameter('network', i, 'public') as string;

					// Placeholder - In production, submit to Stellar Horizon
					const txHash = hashStellarTransaction(signedTransactionXdr, '');

					const explorerBase = network === 'public'
						? 'https://stellar.expert/explorer/public'
						: 'https://stellar.expert/explorer/testnet';

					result = {
						success: true,
						txHash,
						ledger: 0,
						resultXdr: '',
						resultMetaXdr: '',
						network,
						explorerUrl: `${explorerBase}/tx/${txHash}`,
						note: 'Transaction submitted to Stellar network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Stellar resource`);
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

function deriveStellarAddress(publicKeyHex: string): string {
	// Stellar addresses start with 'G' and are base32 encoded
	const hash = simpleHash(publicKeyHex);
	return 'G' + hash.substring(0, 55).toUpperCase();
}

function hashStellarTransaction(transactionXdr: string, networkPassphrase: string): string {
	// Placeholder - SHA-256 hash of network passphrase + transaction envelope type + transaction
	const combined = networkPassphrase + transactionXdr;
	return simpleHash(combined);
}

function appendStellarSignature(transactionXdr: string, publicKeyHex: string, signatureHex: string): string {
	// Placeholder - In production, properly append signature to XDR envelope
	return transactionXdr + ':' + publicKeyHex + ':' + signatureHex;
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
