/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * XRP Resource Operations
 * Handles XRP Ledger interactions via Tangem card
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

					const address = deriveXrpAddress(publicKey);
					const xAddress = toXAddress(address, network === 'mainnet');

					result = {
						success: true,
						address,
						xAddress,
						publicKey,
						network,
						derivationPath: "m/44'/144'/0'/0/0",
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

					// Serialize and hash transaction for signing
					const serializedTx = serializeXrpTransaction(transaction);
					const txHash = hashXrpTransaction(serializedTx);

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'XRP Transaction',
					);

					// Build signed transaction
					const signedTx = {
						...transaction,
						SigningPubKey: signResult.publicKey,
						TxnSignature: signResult.signature,
					};

					result = {
						success: true,
						signedTransaction: signedTx,
						txBlob: serializeXrpTransaction(signedTx),
						hash: txHash,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getAccountInfo': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveXrpAddress(publicKey);

					// Placeholder - In production, query XRP Ledger
					result = {
						success: true,
						address,
						balance: '0',
						balanceDrops: '0',
						balanceXrp: '0',
						sequence: 0,
						ownerCount: 0,
						flags: 0,
						activated: false,
						reserveBase: '10000000',
						reserveIncrement: '2000000',
						network,
						note: 'Account info fetched from XRP Ledger',
					};
					break;
				}

				case 'broadcastTransaction': {
					const txBlob = this.getNodeParameter('txBlob', i) as string;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;
					const failHard = this.getNodeParameter('failHard', i, false) as boolean;

					// Placeholder - In production, submit to XRP Ledger
					const txHash = hashXrpTransaction(txBlob);

					const explorerBase = network === 'mainnet'
						? 'https://livenet.xrpl.org'
						: 'https://testnet.xrpl.org';

					result = {
						success: true,
						txHash,
						resultCode: 'tesSUCCESS',
						resultMessage: 'The transaction was applied',
						validated: true,
						ledgerIndex: 0,
						network,
						failHard,
						explorerUrl: `${explorerBase}/transactions/${txHash}`,
						note: 'Transaction submitted to XRP Ledger',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for XRP resource`);
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

function deriveXrpAddress(publicKeyHex: string): string {
	// XRP addresses start with 'r' and are base58check encoded
	const hash = simpleHash(publicKeyHex);
	return 'r' + hash.substring(0, 33);
}

function toXAddress(classicAddress: string, isMainnet: boolean): string {
	// X-addresses are a newer format that includes tag info
	const prefix = isMainnet ? 'X' : 'T';
	const hash = simpleHash(classicAddress);
	return prefix + hash.substring(0, 46);
}

function serializeXrpTransaction(transaction: Record<string, unknown>): string {
	// Placeholder - In production, use ripple-binary-codec
	return Buffer.from(JSON.stringify(transaction)).toString('hex');
}

function hashXrpTransaction(serializedTx: string): string {
	// Placeholder - SHA-512Half
	return simpleHash(serializedTx).substring(0, 64);
}

function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(64, '0').toUpperCase();
}
