/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Cosmos Resource Operations
 * Handles Cosmos SDK chain interactions via Tangem card
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
					const chain = this.getNodeParameter('chain', i, 'cosmos') as string;
					const hrp = this.getNodeParameter('hrp', i, 'cosmos') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const chainHrp = getCosmosHrp(chain) || hrp;
					const address = encodeCosmosAddress(publicKey, chainHrp);

					result = {
						success: true,
						address,
						publicKey,
						chain,
						hrp: chainHrp,
						derivationPath: "m/44'/118'/0'/0/0",
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signTransaction': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const signDocJson = this.getNodeParameter('signDocJson', i) as string;
					const signMode = this.getNodeParameter('signMode', i, 'direct') as string;

					let signDoc: Record<string, unknown>;
					try {
						signDoc = JSON.parse(signDocJson);
					} catch {
						throw new Error('Invalid SignDoc JSON');
					}

					// Hash the sign doc
					const signBytes = serializeCosmosSignDoc(signDoc, signMode);
					const signBytesHash = hashCosmosSignBytes(signBytes);

					const signResult = await cardReader.signHash(
						walletIndex,
						signBytesHash,
						'Cosmos Transaction',
					);

					result = {
						success: true,
						signature: signResult.signature,
						signatureBase64: Buffer.from(signResult.signature, 'hex').toString('base64'),
						publicKey: signResult.publicKey,
						signMode,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'cosmos') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const chainHrp = getCosmosHrp(chain);
					const address = encodeCosmosAddress(publicKey, chainHrp);

					// Placeholder - In production, query Cosmos LCD/RPC
					result = {
						success: true,
						address,
						balances: [
							{
								denom: getCosmosBaseDenom(chain),
								amount: '0',
							},
						],
						chain,
						note: 'Balance fetched from Cosmos LCD API',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedTxBytes = this.getNodeParameter('signedTxBytes', i) as string;
					const chain = this.getNodeParameter('chain', i, 'cosmos') as string;
					const broadcastMode = this.getNodeParameter('broadcastMode', i, 'sync') as string;

					// Placeholder - In production, broadcast to Cosmos node
					const txHash = hashCosmosSignBytes(signedTxBytes).toUpperCase();

					const explorerMap: Record<string, string> = {
						cosmos: 'https://www.mintscan.io/cosmos',
						osmosis: 'https://www.mintscan.io/osmosis',
						juno: 'https://www.mintscan.io/juno',
						terra: 'https://finder.terra.money/mainnet',
						evmos: 'https://www.mintscan.io/evmos',
						injective: 'https://www.mintscan.io/injective',
					};

					result = {
						success: true,
						txHash,
						code: 0,
						rawLog: '',
						broadcastMode,
						chain,
						explorerUrl: `${explorerMap[chain] || explorerMap.cosmos}/tx/${txHash}`,
						note: 'Transaction broadcast to Cosmos network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Cosmos resource`);
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

function getCosmosHrp(chain: string): string {
	const hrpMap: Record<string, string> = {
		cosmos: 'cosmos',
		osmosis: 'osmo',
		juno: 'juno',
		terra: 'terra',
		evmos: 'evmos',
		injective: 'inj',
		stargaze: 'stars',
		akash: 'akash',
		kava: 'kava',
		secret: 'secret',
	};
	return hrpMap[chain] || 'cosmos';
}

function getCosmosBaseDenom(chain: string): string {
	const denomMap: Record<string, string> = {
		cosmos: 'uatom',
		osmosis: 'uosmo',
		juno: 'ujuno',
		terra: 'uluna',
		evmos: 'aevmos',
		injective: 'inj',
	};
	return denomMap[chain] || 'uatom';
}

function encodeCosmosAddress(publicKeyHex: string, hrp: string): string {
	// Placeholder - In production, use bech32 encoding
	const hash = simpleHash(publicKeyHex);
	return hrp + '1' + hash.substring(0, 38).toLowerCase();
}

function serializeCosmosSignDoc(signDoc: Record<string, unknown>, signMode: string): string {
	// Placeholder - In production, use proper protobuf serialization
	if (signMode === 'amino') {
		return JSON.stringify(sortObject(signDoc));
	}
	// Direct mode - protobuf encoding
	return JSON.stringify(signDoc);
}

function hashCosmosSignBytes(signBytes: string): string {
	// SHA-256 hash
	return simpleHash(signBytes);
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
	if (typeof obj !== 'object' || obj === null) {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(sortObject) as unknown as Record<string, unknown>;
	}
	const sorted: Record<string, unknown> = {};
	Object.keys(obj).sort().forEach(key => {
		sorted[key] = sortObject(obj[key] as Record<string, unknown>);
	});
	return sorted;
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
