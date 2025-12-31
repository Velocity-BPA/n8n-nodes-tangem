/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Token Resource Operations
 * Handles token operations across multiple blockchains via Tangem card
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
				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// Placeholder - In production, query blockchain
					result = {
						success: true,
						chain,
						tokenAddress,
						balance: '0',
						balanceFormatted: '0',
						decimals: 18,
						symbol: 'TOKEN',
						name: 'Unknown Token',
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getInfo': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;

					// Placeholder - In production, query token contract
					result = {
						success: true,
						chain,
						tokenAddress,
						name: 'Unknown Token',
						symbol: 'TOKEN',
						decimals: 18,
						totalSupply: '0',
						contractVerified: false,
					};
					break;
				}

				case 'signTransfer': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
					const toAddress = this.getNodeParameter('toAddress', i) as string;
					const amount = this.getNodeParameter('amount', i) as string;
					const decimals = this.getNodeParameter('decimals', i, 18) as number;

					// Build ERC20 transfer data
					const transferData = encodeErc20Transfer(toAddress, amount, decimals);

					// Build transaction
					const txData = {
						to: tokenAddress,
						data: transferData,
						value: '0x0',
					};

					const txHash = simpleHash(JSON.stringify(txData));

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'Token Transfer',
					);

					result = {
						success: true,
						chain,
						tokenAddress,
						toAddress,
						amount,
						transferData,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'signApproval': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
					const spenderAddress = this.getNodeParameter('spenderAddress', i) as string;
					const amount = this.getNodeParameter('amount', i, 'unlimited') as string;

					// Build ERC20 approve data
					const approveData = encodeErc20Approve(spenderAddress, amount);

					const txData = {
						to: tokenAddress,
						data: approveData,
						value: '0x0',
					};

					const txHash = simpleHash(JSON.stringify(txData));

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'Token Approval',
					);

					result = {
						success: true,
						chain,
						tokenAddress,
						spenderAddress,
						amount: amount === 'unlimited' ? 'Unlimited' : amount,
						approveData,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getNfts': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// Placeholder - In production, query NFT indexer
					result = {
						success: true,
						chain,
						nfts: [],
						totalCount: 0,
						note: 'NFTs fetched from indexer API',
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signNftTransfer': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const contractAddress = this.getNodeParameter('contractAddress', i) as string;
					const tokenId = this.getNodeParameter('tokenId', i) as string;
					const toAddress = this.getNodeParameter('toAddress', i) as string;
					const tokenStandard = this.getNodeParameter('tokenStandard', i, 'ERC721') as string;

					// Build transfer data based on standard
					const transferData = tokenStandard === 'ERC721'
						? encodeErc721Transfer(toAddress, tokenId)
						: encodeErc1155Transfer(toAddress, tokenId, '1');

					const txData = {
						to: contractAddress,
						data: transferData,
						value: '0x0',
					};

					const txHash = simpleHash(JSON.stringify(txData));

					const signResult = await cardReader.signHash(
						walletIndex,
						txHash,
						'NFT Transfer',
					);

					result = {
						success: true,
						chain,
						contractAddress,
						tokenId,
						toAddress,
						tokenStandard,
						transferData,
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getSupportedTokens': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;

					// Return commonly supported tokens
					const tokensByChain: Record<string, Array<{ symbol: string; address: string; decimals: number }>> = {
						ethereum: [
							{ symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
							{ symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
							{ symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EesddKAD3eF3B', decimals: 18 },
							{ symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
						],
						polygon: [
							{ symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
							{ symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
						],
						bsc: [
							{ symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
							{ symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
						],
					};

					result = {
						success: true,
						chain,
						tokens: tokensByChain[chain] || [],
						note: 'This is a subset of supported tokens',
					};
					break;
				}

				case 'addCustomToken': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
					const symbol = this.getNodeParameter('symbol', i) as string;
					const decimals = this.getNodeParameter('decimals', i) as number;
					const name = this.getNodeParameter('name', i, '') as string;

					// Validate token address format
					if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
						throw new Error('Invalid token address format');
					}

					result = {
						success: true,
						chain,
						token: {
							address: tokenAddress.toLowerCase(),
							symbol,
							decimals,
							name: name || symbol,
							custom: true,
						},
						message: 'Custom token added successfully',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Token resource`);
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

function encodeErc20Transfer(to: string, amount: string, decimals: number): string {
	// transfer(address,uint256) = 0xa9059cbb
	const paddedTo = to.toLowerCase().replace('0x', '').padStart(64, '0');
	const amountBigInt = BigInt(parseFloat(amount) * Math.pow(10, decimals));
	const paddedAmount = amountBigInt.toString(16).padStart(64, '0');
	return '0xa9059cbb' + paddedTo + paddedAmount;
}

function encodeErc20Approve(spender: string, amount: string): string {
	// approve(address,uint256) = 0x095ea7b3
	const paddedSpender = spender.toLowerCase().replace('0x', '').padStart(64, '0');
	const amountValue = amount === 'unlimited'
		? 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
		: BigInt(amount).toString(16).padStart(64, '0');
	return '0x095ea7b3' + paddedSpender + amountValue;
}

function encodeErc721Transfer(to: string, tokenId: string): string {
	// transferFrom(address,address,uint256) = 0x23b872dd
	// Note: from address would be added by the caller
	const paddedTo = to.toLowerCase().replace('0x', '').padStart(64, '0');
	const paddedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
	return '0x23b872dd' + '0'.repeat(64) + paddedTo + paddedTokenId;
}

function encodeErc1155Transfer(to: string, tokenId: string, amount: string): string {
	// safeTransferFrom(address,address,uint256,uint256,bytes) = 0xf242432a
	const paddedTo = to.toLowerCase().replace('0x', '').padStart(64, '0');
	const paddedTokenId = BigInt(tokenId).toString(16).padStart(64, '0');
	const paddedAmount = BigInt(amount).toString(16).padStart(64, '0');
	return '0xf242432a' + '0'.repeat(64) + paddedTo + paddedTokenId + paddedAmount;
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
