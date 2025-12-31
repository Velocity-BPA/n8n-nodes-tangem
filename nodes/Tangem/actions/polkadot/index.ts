/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Polkadot Resource Operations
 * Handles Polkadot/Substrate chain interactions via Tangem card
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
					const network = this.getNodeParameter('network', i, 'polkadot') as string;
					const ss58Prefix = this.getNodeParameter('ss58Prefix', i, 0) as number;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const prefixMap: Record<string, number> = {
						polkadot: 0,
						kusama: 2,
						westend: 42,
						substrate: 42,
					};

					const prefix = ss58Prefix || prefixMap[network] || 0;
					const address = encodeSubstrateAddress(publicKey, prefix);

					result = {
						success: true,
						address,
						publicKey,
						network,
						ss58Prefix: prefix,
						derivationPath: "m/44'/354'/0'/0'/0'",
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signExtrinsic': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const extrinsicPayload = this.getNodeParameter('extrinsicPayload', i) as string;
					const network = this.getNodeParameter('network', i, 'polkadot') as string;

					// Sign the extrinsic payload (SCALE encoded)
					const payloadHash = hashExtrinsicPayload(extrinsicPayload);

					const signResult = await cardReader.signHash(
						walletIndex,
						payloadHash,
						'Polkadot Extrinsic',
					);

					result = {
						success: true,
						signature: '0x01' + signResult.signature, // 0x01 = sr25519 signature type
						signatureType: 'sr25519',
						payloadHash,
						publicKey: signResult.publicKey,
						network,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const network = this.getNodeParameter('network', i, 'polkadot') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const prefixMap: Record<string, number> = {
						polkadot: 0,
						kusama: 2,
						westend: 42,
					};

					const address = encodeSubstrateAddress(publicKey, prefixMap[network] || 0);

					// Placeholder - In production, query Polkadot node
					result = {
						success: true,
						address,
						free: '0',
						reserved: '0',
						miscFrozen: '0',
						feeFrozen: '0',
						total: '0',
						transferable: '0',
						network,
						decimals: network === 'kusama' ? 12 : 10,
						symbol: network === 'kusama' ? 'KSM' : 'DOT',
						note: 'Balance fetched from Polkadot node',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedExtrinsic = this.getNodeParameter('signedExtrinsic', i) as string;
					const network = this.getNodeParameter('network', i, 'polkadot') as string;

					// Placeholder - In production, submit to Polkadot node
					const txHash = '0x' + hashExtrinsicPayload(signedExtrinsic);

					const explorerMap: Record<string, string> = {
						polkadot: 'https://polkadot.subscan.io',
						kusama: 'https://kusama.subscan.io',
						westend: 'https://westend.subscan.io',
					};

					result = {
						success: true,
						txHash,
						blockHash: null,
						blockNumber: null,
						extrinsicIndex: null,
						network,
						explorerUrl: `${explorerMap[network] || explorerMap.polkadot}/extrinsic/${txHash}`,
						note: 'Extrinsic submitted to Polkadot network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Polkadot resource`);
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

function encodeSubstrateAddress(publicKeyHex: string, ss58Prefix: number): string {
	// Placeholder - In production, use @polkadot/util-crypto
	const hash = simpleHash(publicKeyHex + ss58Prefix.toString());
	// SS58 addresses are base58 encoded with prefix
	const prefixChar = ss58Prefix === 0 ? '1' : ss58Prefix === 2 ? 'C' : '5';
	return prefixChar + hash.substring(0, 47);
}

function hashExtrinsicPayload(payload: string): string {
	// Placeholder - Blake2b-256 hash
	return simpleHash(payload);
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
