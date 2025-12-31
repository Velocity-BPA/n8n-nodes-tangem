/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { getAllSupportedChains, getChainConfig } from '../../constants/chains';
import { getDerivationPathForChain } from '../../constants/derivationPaths';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('tangemCard');
	const cardReader = new TangemCardReader({
		timeout: (credentials.nfcTimeout as number) || 30000,
		retryAttempts: (credentials.retryAttempts as number) || 3,
	});

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'getAccounts': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const accounts = cardData.data.accounts || [];
				result = {
					success: true,
					accounts: accounts.map((acc: Record<string, unknown>) => ({
						chain: acc.chain,
						address: acc.address,
						publicKey: acc.publicKey,
						derivationPath: acc.derivationPath,
						balance: acc.balance,
					})),
					totalAccounts: accounts.length,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getAccountByChain': {
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
			const cardData = await cardReader.readCard();

			if (cardData.success && cardData.data) {
				const accounts = cardData.data.accounts || [];
				const account = accounts.find((acc: Record<string, unknown>) => acc.chain === chain);

				if (account) {
					result = {
						success: true,
						account: {
							chain: account.chain,
							address: account.address,
							publicKey: account.publicKey,
							derivationPath: account.derivationPath,
							balance: account.balance,
						},
					};
				} else {
					result = { success: false, error: `No account found for chain: ${chain}` };
				}
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getAccountAddress': {
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;

			const walletResult = await cardReader.getWallet(walletIndex);
			if (walletResult.success && walletResult.data) {
				const chainConfig = getChainConfig(chain);
				const derivationPath = getDerivationPathForChain(chain);

				// Derive address for the specific chain
				let address = '';
				if (chainConfig?.networkType === 'evm') {
					address = deriveEvmAddress(walletResult.data.publicKey);
				} else {
					address = walletResult.data.publicKey; // Placeholder
				}

				result = {
					success: true,
					chain,
					address,
					publicKey: walletResult.data.publicKey,
					derivationPath,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getAccountBalance': {
			const address = this.getNodeParameter('address', index, '') as string;
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;

			// In production, this would query the blockchain
			result = {
				success: true,
				chain,
				address,
				balance: '0',
				balanceFormatted: '0',
				symbol: getChainConfig(chain)?.symbol || 'ETH',
			};
			break;
		}

		case 'getAccountHistory': {
			const address = this.getNodeParameter('address', index, '') as string;
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
				maxResults?: number;
			};

			// In production, this would query transaction history
			result = {
				success: true,
				chain,
				address,
				transactions: [],
				totalCount: 0,
				hasMore: false,
			};
			break;
		}

		case 'addAccount': {
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;

			const derivationPath = getDerivationPathForChain(chain);
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				// In production, derive the specific address for the chain
				const address = deriveEvmAddress(walletResult.data.publicKey);

				result = {
					success: true,
					account: {
						chain,
						address,
						publicKey: walletResult.data.publicKey,
						derivationPath,
						walletIndex,
					},
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'removeAccount': {
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
			// Accounts are derived, not stored - this would update local tracking
			result = {
				success: true,
				message: `Account for ${chain} removed from tracking`,
				chain,
			};
			break;
		}

		case 'getAllAddresses': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const chains = getAllSupportedChains();
				const addresses: Record<string, string> = {};

				// Generate addresses for all supported chains
				for (const chain of chains) {
					const chainConfig = getChainConfig(chain.key);
					if (chainConfig?.networkType === 'evm') {
						addresses[chain.key] = deriveEvmAddress(walletResult.data.publicKey);
					}
				}

				result = {
					success: true,
					publicKey: walletResult.data.publicKey,
					addresses,
					totalChains: Object.keys(addresses).length,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'syncAccount': {
			const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
			const address = this.getNodeParameter('address', index, '') as string;

			// In production, sync balance and transactions from blockchain
			result = {
				success: true,
				chain,
				address,
				synced: true,
				syncedAt: new Date().toISOString(),
			};
			break;
		}

		case 'getMultiChainBalances': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const balances: Record<string, { balance: string; symbol: string }> = {};
				const evmChains = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'];

				// In production, query all chain balances
				for (const chain of evmChains) {
					const config = getChainConfig(chain);
					balances[chain] = {
						balance: '0',
						symbol: config?.symbol || 'ETH',
					};
				}

				result = {
					success: true,
					publicKey: walletResult.data.publicKey,
					balances,
					totalChains: Object.keys(balances).length,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

function deriveEvmAddress(publicKey: string): string {
	// Placeholder - in production use ethers.js
	return `0x${publicKey.slice(-40)}`;
}
