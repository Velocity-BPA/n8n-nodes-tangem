/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Cardano Resource Operations
 * Handles Cardano blockchain interactions via Tangem card
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
					const networkId = this.getNodeParameter('networkId', i, 'mainnet') as string;
					const derivationPath = this.getNodeParameter('derivationPath', i, "m/1852'/1815'/0'/0/0") as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveCardanoAddress(publicKey, networkId);
					result = {
						success: true,
						address,
						publicKey,
						derivationPath,
						networkId,
						addressType: 'base',
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signTransaction': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const transactionBodyHex = this.getNodeParameter('transactionBodyHex', i) as string;
					const networkId = this.getNodeParameter('networkId', i, 'mainnet') as string;

					// Cardano signs the transaction body hash
					const txBodyHash = hashCardanoTxBody(transactionBodyHex);

					const signResult = await cardReader.signHash(
						walletIndex,
						txBodyHash,
						'Cardano Transaction',
					);

					// Build witness set with signature
					const witnessSet = buildCardanoWitnessSet(signResult.publicKey, signResult.signature);

					result = {
						success: true,
						txBodyHash,
						signature: signResult.signature,
						witnessSet,
						publicKey: signResult.publicKey,
						networkId,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getStakingKey': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const derivationPath = this.getNodeParameter('stakingDerivationPath', i, "m/1852'/1815'/0'/2/0") as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// Placeholder - In production, derive staking key from HD path
					const stakingKey = deriveStakingKey(publicKey);

					result = {
						success: true,
						stakingKey,
						derivationPath,
						rewardAddress: deriveRewardAddress(stakingKey, 'mainnet'),
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const networkId = this.getNodeParameter('networkId', i, 'mainnet') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveCardanoAddress(publicKey, networkId);

					// Placeholder - In production, query Cardano node/API
					result = {
						success: true,
						address,
						balance: '0',
						balanceLovelace: '0',
						balanceAda: '0',
						utxoCount: 0,
						tokens: [],
						note: 'Balance fetched from Cardano API',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedTransactionHex = this.getNodeParameter('signedTransactionHex', i) as string;
					const networkId = this.getNodeParameter('networkId', i, 'mainnet') as string;

					// Placeholder - In production, submit to Cardano node
					const txHash = hashCardanoTxBody(signedTransactionHex.substring(0, 64));

					const explorerBase = networkId === 'mainnet'
						? 'https://cardanoscan.io'
						: 'https://preprod.cardanoscan.io';

					result = {
						success: true,
						txHash,
						networkId,
						explorerUrl: `${explorerBase}/transaction/${txHash}`,
						note: 'Transaction submitted to Cardano network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Cardano resource`);
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

function deriveCardanoAddress(publicKeyHex: string, networkId: string): string {
	// Placeholder - In production, use cardano-serialization-lib
	const prefix = networkId === 'mainnet' ? 'addr1' : 'addr_test1';
	const hash = simpleHash(publicKeyHex);
	return `${prefix}${hash.substring(0, 58)}`;
}

function hashCardanoTxBody(txBodyHex: string): string {
	// Placeholder - Blake2b-256 hash
	return simpleHash(txBodyHex);
}

function buildCardanoWitnessSet(publicKeyHex: string, signatureHex: string): string {
	// Placeholder - In production, build proper CBOR witness set
	return JSON.stringify({
		vkeywitnesses: [
			{
				vkey: publicKeyHex,
				signature: signatureHex,
			},
		],
	});
}

function deriveStakingKey(publicKeyHex: string): string {
	// Placeholder - In production, derive from HD path
	return simpleHash(publicKeyHex + 'staking');
}

function deriveRewardAddress(stakingKeyHex: string, networkId: string): string {
	const prefix = networkId === 'mainnet' ? 'stake1' : 'stake_test1';
	const hash = simpleHash(stakingKeyHex);
	return `${prefix}${hash.substring(0, 54)}`;
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
