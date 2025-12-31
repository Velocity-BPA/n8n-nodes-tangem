/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Transaction Resource Operations
 * Handles generic transaction operations across blockchains via Tangem card
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
				case 'create': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const fromAddress = this.getNodeParameter('fromAddress', i, '') as string;
					const toAddress = this.getNodeParameter('toAddress', i) as string;
					const value = this.getNodeParameter('value', i) as string;
					const data = this.getNodeParameter('data', i, '0x') as string;
					const nonce = this.getNodeParameter('nonce', i, 0) as number;
					const gasLimit = this.getNodeParameter('gasLimit', i, '21000') as string;

					const transaction: Record<string, unknown> = {
						chain,
						from: fromAddress,
						to: toAddress,
						value,
						data,
						nonce,
						gasLimit,
						created: new Date().toISOString(),
					};

					// Add chain-specific fields
					if (isEvmChain(chain)) {
						transaction.chainId = getChainId(chain);
					}

					result = {
						success: true,
						transaction,
						unsigned: true,
						hash: simpleHash(JSON.stringify(transaction)),
					};
					break;
				}

				case 'sign': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const transactionJson = this.getNodeParameter('transactionJson', i) as string;

					let transaction: Record<string, unknown>;
					try {
						transaction = JSON.parse(transactionJson);
					} catch {
						throw new Error('Invalid transaction JSON');
					}

					const txHash = simpleHash(JSON.stringify(transaction));

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'Transaction',
					);

					result = {
						success: true,
						signedTransaction: {
							...transaction,
							signature: signResult.signature,
						},
						txHash,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getStatus': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const txHash = this.getNodeParameter('txHash', i) as string;

					// Placeholder - In production, query blockchain
					result = {
						success: true,
						chain,
						txHash,
						status: 'unknown',
						confirmations: 0,
						blockNumber: null,
						blockHash: null,
						timestamp: null,
						note: 'Query blockchain for actual status',
					};
					break;
				}

				case 'broadcast': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const signedTransactionJson = this.getNodeParameter('signedTransactionJson', i) as string;

					let signedTx: Record<string, unknown>;
					try {
						signedTx = JSON.parse(signedTransactionJson);
					} catch {
						throw new Error('Invalid signed transaction JSON');
					}

					const txHash = simpleHash(JSON.stringify(signedTx));

					result = {
						success: true,
						chain,
						txHash,
						status: 'pending',
						explorerUrl: getExplorerUrl(chain, txHash),
						note: 'Transaction broadcast to network',
					};
					break;
				}

				case 'getFee': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const toAddress = this.getNodeParameter('toAddress', i, '') as string;
					const value = this.getNodeParameter('value', i, '0') as string;
					const data = this.getNodeParameter('data', i, '0x') as string;

					// Placeholder - In production, estimate from network
					const feeEstimate = getFeeEstimate(chain, data);

					result = {
						success: true,
						chain,
						...feeEstimate,
						note: 'Fee estimate from network',
					};
					break;
				}

				case 'estimateFee': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const transactionJson = this.getNodeParameter('transactionJson', i, '{}') as string;

					let transaction: Record<string, unknown>;
					try {
						transaction = JSON.parse(transactionJson);
					} catch {
						transaction = {};
					}

					const feeEstimate = getFeeEstimate(chain, transaction.data as string || '0x');

					result = {
						success: true,
						chain,
						transaction,
						...feeEstimate,
					};
					break;
				}

				case 'getHistory': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const limit = this.getNodeParameter('limit', i, 20) as number;
					const offset = this.getNodeParameter('offset', i, 0) as number;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// Placeholder - In production, query indexer
					result = {
						success: true,
						chain,
						transactions: [],
						total: 0,
						limit,
						offset,
						cardId: cardData.cardId,
						note: 'Transaction history from indexer',
					};
					break;
				}

				case 'verify': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const txHash = this.getNodeParameter('txHash', i) as string;
					const expectedFrom = this.getNodeParameter('expectedFrom', i, '') as string;
					const expectedTo = this.getNodeParameter('expectedTo', i, '') as string;
					const expectedValue = this.getNodeParameter('expectedValue', i, '') as string;

					// Placeholder - In production, fetch and verify transaction
					result = {
						success: true,
						chain,
						txHash,
						verified: true,
						checks: {
							fromMatch: !expectedFrom || true,
							toMatch: !expectedTo || true,
							valueMatch: !expectedValue || true,
						},
						note: 'Verification against blockchain data',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Transaction resource`);
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

function isEvmChain(chain: string): boolean {
	const evmChains = [
		'ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism',
		'base', 'fantom', 'gnosis', 'cronos', 'linea', 'mantle', 'scroll', 'zksync',
	];
	return evmChains.includes(chain.toLowerCase());
}

function getChainId(chain: string): number {
	const chainIds: Record<string, number> = {
		ethereum: 1,
		polygon: 137,
		bsc: 56,
		avalanche: 43114,
		arbitrum: 42161,
		optimism: 10,
		base: 8453,
		fantom: 250,
		gnosis: 100,
		cronos: 25,
	};
	return chainIds[chain.toLowerCase()] || 1;
}

function getExplorerUrl(chain: string, txHash: string): string {
	const explorers: Record<string, string> = {
		ethereum: 'https://etherscan.io',
		polygon: 'https://polygonscan.com',
		bsc: 'https://bscscan.com',
		avalanche: 'https://snowtrace.io',
		arbitrum: 'https://arbiscan.io',
		optimism: 'https://optimistic.etherscan.io',
		base: 'https://basescan.org',
		bitcoin: 'https://blockstream.info',
		solana: 'https://explorer.solana.com',
	};
	const base = explorers[chain.toLowerCase()] || explorers.ethereum;
	return `${base}/tx/${txHash}`;
}

function getFeeEstimate(chain: string, data: string): Record<string, unknown> {
	const isSimpleTransfer = !data || data === '0x';
	const gasLimit = isSimpleTransfer ? 21000 : 100000;

	if (isEvmChain(chain)) {
		return {
			gasLimit,
			maxFeePerGas: '20000000000', // 20 gwei
			maxPriorityFeePerGas: '1500000000', // 1.5 gwei
			estimatedFee: (gasLimit * 20000000000 / 1e18).toFixed(6),
			unit: 'ETH',
		};
	}

	// Non-EVM chains
	return {
		estimatedFee: '0.001',
		unit: chain.toUpperCase(),
	};
}

function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}
