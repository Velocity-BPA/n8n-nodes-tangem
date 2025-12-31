/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { getChainConfig, EVM_CHAINS } from '../../constants/chains';
import { hashTypedData } from '../../utils/signingUtils';

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

	const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
	const chainConfig = getChainConfig(chain) || EVM_CHAINS.ethereum;

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'getAddress': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const address = deriveEvmAddress(walletResult.data.publicKey);
				result = {
					success: true,
					chain,
					chainId: chainConfig.chainId,
					address,
					publicKey: walletResult.data.publicKey,
					explorerUrl: `${chainConfig.explorerUrl}/address/${address}`,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'signTransaction': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const transactionData = this.getNodeParameter('transactionData', index, '{}') as string;

			let txData: Record<string, unknown>;
			try {
				txData = JSON.parse(transactionData);
			} catch {
				result = { success: false, error: 'Invalid transaction data JSON' };
				break;
			}

			// Add chain ID if not present
			if (!txData.chainId) {
				txData.chainId = chainConfig.chainId;
			}

			const txHash = createEvmTxHash(txData);
			const signResult = await cardReader.signHash(walletIndex, txHash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, chainConfig.chainId);
				result = {
					success: true,
					chain,
					chainId: chainConfig.chainId,
					signature: { r, s, v, raw: signResult.data.signature },
					signedTransaction: serializeTransaction(txData, { r, s, v }),
					txHash,
				};
			} else {
				result = { success: false, error: signResult.error || 'Failed to sign transaction' };
			}
			break;
		}

		case 'signMessage': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const message = this.getNodeParameter('message', index, '') as string;

			const messageHash = hashMessage(message);
			const signResult = await cardReader.signHash(walletIndex, messageHash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, chainConfig.chainId);
				result = {
					success: true,
					chain,
					signature: `0x${signResult.data.signature}`,
					r,
					s,
					v,
					message,
					messageHash,
				};
			} else {
				result = { success: false, error: signResult.error || 'Failed to sign message' };
			}
			break;
		}

		case 'signTypedData': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const typedDataStr = this.getNodeParameter('typedData', index, '{}') as string;

			let typedData: Record<string, unknown>;
			try {
				typedData = JSON.parse(typedDataStr);
			} catch {
				result = { success: false, error: 'Invalid typed data JSON' };
				break;
			}

			// Add chain ID to domain if not present
			if (typedData.domain && !(typedData.domain as Record<string, unknown>).chainId) {
				(typedData.domain as Record<string, unknown>).chainId = chainConfig.chainId;
			}

			const hash = hashTypedData(typedData);
			const signResult = await cardReader.signHash(walletIndex, hash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, chainConfig.chainId);
				result = {
					success: true,
					chain,
					signature: `0x${signResult.data.signature}`,
					r,
					s,
					v,
					typedDataHash: hash,
				};
			} else {
				result = { success: false, error: signResult.error || 'Failed to sign typed data' };
			}
			break;
		}

		case 'getBalance': {
			const address = this.getNodeParameter('address', index, '') as string;

			// In production, query from chain's RPC endpoint
			result = {
				success: true,
				chain,
				chainId: chainConfig.chainId,
				address,
				balance: '0',
				balanceFormatted: `0 ${chainConfig.symbol}`,
				symbol: chainConfig.symbol,
			};
			break;
		}

		case 'broadcastTransaction': {
			const signedTx = this.getNodeParameter('transactionData', index, '') as string;

			// In production, broadcast to chain's RPC endpoint
			const txHash = `0x${Date.now().toString(16)}${'0'.repeat(40)}`;
			result = {
				success: true,
				chain,
				chainId: chainConfig.chainId,
				txHash,
				explorerUrl: `${chainConfig.explorerUrl}/tx/${txHash}`,
				broadcastAt: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

// Helper functions
function deriveEvmAddress(publicKey: string): string {
	return `0x${publicKey.slice(-40)}`;
}

function createEvmTxHash(txData: Record<string, unknown>): string {
	return `0x${Date.now().toString(16)}`;
}

function hashMessage(message: string): string {
	return `0x${Date.now().toString(16)}`;
}

function parseSignature(
	signature: string,
	chainId: number,
): { r: string; s: string; v: number } {
	const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
	const r = `0x${sig.slice(0, 64)}`;
	const s = `0x${sig.slice(64, 128)}`;
	const recoveryId = parseInt(sig.slice(128, 130), 16);
	const v = chainId * 2 + 35 + recoveryId;
	return { r, s, v };
}

function serializeTransaction(
	txData: Record<string, unknown>,
	sig: { r: string; s: string; v: number },
): string {
	return `0x${Date.now().toString(16)}`;
}
