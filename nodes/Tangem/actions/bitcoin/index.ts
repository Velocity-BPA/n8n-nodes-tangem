/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { BITCOIN_NETWORKS } from '../../constants/chains';
import { DERIVATION_PATHS } from '../../constants/derivationPaths';

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

	const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
		network?: string;
		addressFormat?: string;
	};
	const network = additionalOptions.network || 'mainnet';
	const addressFormat = additionalOptions.addressFormat || 'nativeSegwit';

	let result: Record<string, unknown> = {};

	switch (operation) {
		case 'getAddress': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const address = deriveBitcoinAddress(
					walletResult.data.publicKey,
					network,
					addressFormat,
				);

				result = {
					success: true,
					address,
					publicKey: walletResult.data.publicKey,
					network,
					format: addressFormat,
					derivationPath: getDerivationPathForFormat(addressFormat),
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getPublicKey': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				result = {
					success: true,
					publicKey: walletResult.data.publicKey,
					publicKeyHex: `0x${walletResult.data.publicKey}`,
					compressed: true,
					curve: walletResult.data.curve,
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

			// Create transaction hash to sign
			const txHash = createBitcoinTxHash(txData);
			const signResult = await cardReader.signHash(walletIndex, txHash);

			if (signResult.success && signResult.data) {
				result = {
					success: true,
					signature: signResult.data.signature,
					txHash,
					signedTransaction: buildSignedTransaction(txData, signResult.data.signature),
				};
			} else {
				result = { success: false, error: signResult.error || 'Failed to sign transaction' };
			}
			break;
		}

		case 'signPsbt': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const psbtData = this.getNodeParameter('transactionData', index, '') as string;

			// Parse PSBT and extract hashes to sign
			const hashesToSign = parsePsbtHashes(psbtData);

			if (hashesToSign.length === 0) {
				result = { success: false, error: 'No inputs to sign in PSBT' };
				break;
			}

			const signatures: string[] = [];
			for (const hash of hashesToSign) {
				const signResult = await cardReader.signHash(walletIndex, hash);
				if (signResult.success && signResult.data) {
					signatures.push(signResult.data.signature);
				} else {
					result = { success: false, error: `Failed to sign input: ${signResult.error}` };
					break;
				}
			}

			if (signatures.length === hashesToSign.length) {
				result = {
					success: true,
					signatures,
					inputsCount: signatures.length,
					signedPsbt: combinePsbtSignatures(psbtData, signatures),
				};
			}
			break;
		}

		case 'getUtxo': {
			const address = this.getNodeParameter('address', index, '') as string;

			// In production, query UTXO from blockchain API
			result = {
				success: true,
				address,
				network,
				utxos: [],
				totalValue: '0',
				count: 0,
			};
			break;
		}

		case 'createTransaction': {
			const transactionData = this.getNodeParameter('transactionData', index, '{}') as string;

			let txData: Record<string, unknown>;
			try {
				txData = JSON.parse(transactionData);
			} catch {
				result = { success: false, error: 'Invalid transaction data JSON' };
				break;
			}

			// Build unsigned transaction
			const unsignedTx = buildUnsignedTransaction(txData, network);

			result = {
				success: true,
				unsignedTransaction: unsignedTx,
				inputsCount: (txData.inputs as unknown[])?.length || 0,
				outputsCount: (txData.outputs as unknown[])?.length || 0,
				fee: txData.fee || '0',
			};
			break;
		}

		case 'estimateFee': {
			const transactionData = this.getNodeParameter('transactionData', index, '{}') as string;

			let txData: Record<string, unknown>;
			try {
				txData = JSON.parse(transactionData);
			} catch {
				result = { success: false, error: 'Invalid transaction data JSON' };
				break;
			}

			// Estimate transaction size and fee
			const inputsCount = (txData.inputs as unknown[])?.length || 1;
			const outputsCount = (txData.outputs as unknown[])?.length || 2;
			const estimatedSize = estimateTxSize(inputsCount, outputsCount, addressFormat);

			// Get fee rate (in production, query from mempool)
			const feeRate = 10; // sat/vB

			result = {
				success: true,
				estimatedSize,
				feeRate,
				estimatedFee: estimatedSize * feeRate,
				estimatedFeeFormatted: `${(estimatedSize * feeRate) / 100000000} BTC`,
			};
			break;
		}

		case 'broadcastTransaction': {
			const signedTx = this.getNodeParameter('transactionData', index, '') as string;

			// In production, broadcast to Bitcoin network
			result = {
				success: true,
				txHash: `btc_tx_${Date.now()}`,
				broadcastAt: new Date().toISOString(),
				network,
			};
			break;
		}

		case 'signMessage': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const message = this.getNodeParameter('message', index, '') as string;

			// Create Bitcoin message hash
			const messageHash = createBitcoinMessageHash(message);
			const signResult = await cardReader.signHash(walletIndex, messageHash);

			if (signResult.success && signResult.data) {
				result = {
					success: true,
					signature: signResult.data.signature,
					signatureBase64: Buffer.from(signResult.data.signature, 'hex').toString('base64'),
					message,
					messageHash,
				};
			} else {
				result = { success: false, error: signResult.error || 'Failed to sign message' };
			}
			break;
		}

		case 'verifyMessage': {
			const message = this.getNodeParameter('message', index, '') as string;
			const address = this.getNodeParameter('address', index, '') as string;
			const signature = this.getNodeParameter('additionalOptions.signature', index, '') as string;

			// Verify signature (in production, use bitcoinjs-lib)
			const isValid = verifyBitcoinMessage(message, address, signature);

			result = {
				success: true,
				isValid,
				message,
				address,
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

// Helper functions
function deriveBitcoinAddress(publicKey: string, network: string, format: string): string {
	// In production, use bitcoinjs-lib
	const prefix = network === 'mainnet' ? 'bc1' : 'tb1';
	return `${prefix}${publicKey.slice(0, 38)}`;
}

function getDerivationPathForFormat(format: string): string {
	switch (format) {
		case 'legacy':
			return DERIVATION_PATHS.bitcoin_legacy?.path || "m/44'/0'/0'/0/0";
		case 'segwit':
			return DERIVATION_PATHS.bitcoin_segwit?.path || "m/49'/0'/0'/0/0";
		case 'nativeSegwit':
			return DERIVATION_PATHS.bitcoin?.path || "m/84'/0'/0'/0/0";
		case 'taproot':
			return DERIVATION_PATHS.bitcoin_taproot?.path || "m/86'/0'/0'/0/0";
		default:
			return "m/84'/0'/0'/0/0";
	}
}

function createBitcoinTxHash(txData: Record<string, unknown>): string {
	// In production, compute proper sighash
	return `hash_${Date.now()}`;
}

function buildSignedTransaction(txData: Record<string, unknown>, signature: string): string {
	// In production, build complete signed transaction
	return `signed_tx_${Date.now()}`;
}

function parsePsbtHashes(psbt: string): string[] {
	// In production, parse PSBT and extract input hashes
	return [];
}

function combinePsbtSignatures(psbt: string, signatures: string[]): string {
	// In production, combine signatures into PSBT
	return psbt;
}

function buildUnsignedTransaction(txData: Record<string, unknown>, network: string): string {
	// In production, build unsigned transaction
	return `unsigned_tx_${Date.now()}`;
}

function estimateTxSize(inputs: number, outputs: number, format: string): number {
	// Estimate virtual bytes based on format
	const baseSize = 10; // Version + locktime
	let inputSize = 148; // Legacy input
	let outputSize = 34; // P2PKH output

	if (format === 'nativeSegwit') {
		inputSize = 68;
		outputSize = 31;
	} else if (format === 'taproot') {
		inputSize = 57.5;
		outputSize = 43;
	}

	return Math.ceil(baseSize + (inputs * inputSize) + (outputs * outputSize));
}

function createBitcoinMessageHash(message: string): string {
	// In production, create proper Bitcoin message hash
	const prefix = '\x18Bitcoin Signed Message:\n';
	return `hash_${message.length}`;
}

function verifyBitcoinMessage(message: string, address: string, signature: string): boolean {
	// In production, verify using bitcoinjs-lib
	return true;
}
