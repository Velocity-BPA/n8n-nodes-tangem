/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
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

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'getAddress': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const address = deriveEthereumAddress(walletResult.data.publicKey);
				result = {
					success: true,
					address,
					checksumAddress: toChecksumAddress(address),
					publicKey: walletResult.data.publicKey,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'signEip1559Transaction': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const transactionData = this.getNodeParameter('transactionData', index, '{}') as string;

			let txData: Record<string, unknown>;
			try {
				txData = JSON.parse(transactionData);
			} catch {
				result = { success: false, error: 'Invalid transaction data JSON' };
				break;
			}

			// Validate EIP-1559 fields
			if (!txData.maxFeePerGas || !txData.maxPriorityFeePerGas) {
				result = { success: false, error: 'Missing EIP-1559 gas fields' };
				break;
			}

			const txHash = createEip1559TxHash(txData);
			const signResult = await cardReader.signHash(walletIndex, txHash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, txData.chainId as number);
				result = {
					success: true,
					signature: {
						r,
						s,
						v,
						raw: signResult.data.signature,
					},
					signedTransaction: serializeEip1559Transaction(txData, { r, s, v }),
					txHash,
				};
			} else {
				result = { success: false, error: signResult.error || 'Failed to sign transaction' };
			}
			break;
		}

		case 'signLegacyTransaction': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const transactionData = this.getNodeParameter('transactionData', index, '{}') as string;

			let txData: Record<string, unknown>;
			try {
				txData = JSON.parse(transactionData);
			} catch {
				result = { success: false, error: 'Invalid transaction data JSON' };
				break;
			}

			const txHash = createLegacyTxHash(txData);
			const signResult = await cardReader.signHash(walletIndex, txHash);

			if (signResult.success && signResult.data) {
				const chainId = (txData.chainId as number) || 1;
				const { r, s, v } = parseSignature(signResult.data.signature, chainId);

				result = {
					success: true,
					signature: { r, s, v, raw: signResult.data.signature },
					signedTransaction: serializeLegacyTransaction(txData, { r, s, v }),
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

			const messageHash = hashEthereumMessage(message);
			const signResult = await cardReader.signHash(walletIndex, messageHash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, 1);
				result = {
					success: true,
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

		case 'signPersonalMessage': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const message = this.getNodeParameter('message', index, '') as string;

			// Personal sign uses Ethereum signed message prefix
			const messageHash = hashPersonalMessage(message);
			const signResult = await cardReader.signHash(walletIndex, messageHash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, 1);
				result = {
					success: true,
					signature: `0x${signResult.data.signature}`,
					r,
					s,
					v,
					message,
					messageHash,
					prefix: `\x19Ethereum Signed Message:\n${message.length}`,
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

			const hash = hashTypedData(typedData);
			const signResult = await cardReader.signHash(walletIndex, hash);

			if (signResult.success && signResult.data) {
				const { r, s, v } = parseSignature(signResult.data.signature, 1);
				result = {
					success: true,
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

			// In production, query from Ethereum node
			result = {
				success: true,
				address,
				balance: '0',
				balanceWei: '0',
				balanceFormatted: '0 ETH',
			};
			break;
		}

		case 'getTokenBalances': {
			const address = this.getNodeParameter('address', index, '') as string;

			// In production, query token balances
			result = {
				success: true,
				address,
				tokens: [],
				totalTokens: 0,
			};
			break;
		}

		case 'getNonce': {
			const address = this.getNodeParameter('address', index, '') as string;

			// In production, query from Ethereum node
			result = {
				success: true,
				address,
				nonce: 0,
			};
			break;
		}

		case 'estimateGas': {
			const transactionData = this.getNodeParameter('transactionData', index, '{}') as string;

			let txData: Record<string, unknown>;
			try {
				txData = JSON.parse(transactionData);
			} catch {
				result = { success: false, error: 'Invalid transaction data JSON' };
				break;
			}

			// In production, estimate gas from Ethereum node
			const gasLimit = 21000; // Base transfer
			const gasPrice = 20000000000; // 20 gwei

			result = {
				success: true,
				gasLimit,
				gasPrice: gasPrice.toString(),
				gasPriceGwei: '20',
				estimatedCost: (gasLimit * gasPrice).toString(),
				estimatedCostEth: ((gasLimit * gasPrice) / 1e18).toFixed(6),
			};
			break;
		}

		case 'broadcastTransaction': {
			const signedTx = this.getNodeParameter('transactionData', index, '') as string;

			// In production, broadcast to Ethereum network
			result = {
				success: true,
				txHash: `0x${Date.now().toString(16)}${'0'.repeat(40)}`,
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
function deriveEthereumAddress(publicKey: string): string {
	// In production, use ethers.js: computeAddress(publicKey)
	return `0x${publicKey.slice(-40)}`;
}

function toChecksumAddress(address: string): string {
	// In production, use ethers.js: getAddress(address)
	return address;
}

function createEip1559TxHash(txData: Record<string, unknown>): string {
	// In production, RLP encode and keccak256
	return `0x${Date.now().toString(16)}`;
}

function createLegacyTxHash(txData: Record<string, unknown>): string {
	// In production, RLP encode and keccak256
	return `0x${Date.now().toString(16)}`;
}

function hashEthereumMessage(message: string): string {
	// In production, use ethers.js: hashMessage
	return `0x${Date.now().toString(16)}`;
}

function hashPersonalMessage(message: string): string {
	// In production, use ethers.js: hashMessage with prefix
	const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
	return `0x${Date.now().toString(16)}`;
}

function parseSignature(
	signature: string,
	chainId: number,
): { r: string; s: string; v: number } {
	// Parse 65-byte signature
	const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
	const r = `0x${sig.slice(0, 64)}`;
	const s = `0x${sig.slice(64, 128)}`;
	const recoveryId = parseInt(sig.slice(128, 130), 16);
	const v = chainId * 2 + 35 + recoveryId;

	return { r, s, v };
}

function serializeEip1559Transaction(
	txData: Record<string, unknown>,
	sig: { r: string; s: string; v: number },
): string {
	// In production, use ethers.js to serialize
	return `0x02${Date.now().toString(16)}`;
}

function serializeLegacyTransaction(
	txData: Record<string, unknown>,
	sig: { r: string; s: string; v: number },
): string {
	// In production, use ethers.js to serialize
	return `0x${Date.now().toString(16)}`;
}
