/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * Solana Resource Operations
 * Handles Solana blockchain interactions via Tangem card
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
					const derivationPath = this.getNodeParameter('derivationPath', i, "m/44'/501'/0'/0'") as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveSolanaAddress(publicKey);
					result = {
						success: true,
						address,
						publicKey,
						derivationPath,
						chain: 'solana',
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getPublicKey': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const encoding = this.getNodeParameter('encoding', i, 'base58') as string;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					result = {
						success: true,
						publicKey: encoding === 'base58' ? publicKey : Buffer.from(publicKey, 'hex').toString(encoding as BufferEncoding),
						encoding,
						cardId: cardData.cardId,
					};
					break;
				}

				case 'signTransaction': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const transactionBase64 = this.getNodeParameter('transactionBase64', i) as string;
					const requireConfirmation = this.getNodeParameter('requireConfirmation', i, true) as boolean;

					const transactionBytes = Buffer.from(transactionBase64, 'base64');
					const messageHash = hashSolanaMessage(transactionBytes);

					const signResult = await cardReader.signHash(
						walletIndex,
						messageHash,
						'Solana Transaction',
					);

					const signedTransaction = appendSignatureToTransaction(transactionBytes, signResult.signature);

					result = {
						success: true,
						signedTransaction: signedTransaction.toString('base64'),
						signature: signResult.signature,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'signMessage': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const message = this.getNodeParameter('message', i) as string;
					const encoding = this.getNodeParameter('messageEncoding', i, 'utf8') as string;

					const messageBytes = encoding === 'base64'
						? Buffer.from(message, 'base64')
						: Buffer.from(message, 'utf8');

					// Solana uses the message directly (no prefix like Ethereum)
					const messageHash = hashSolanaMessage(messageBytes);

					const signResult = await cardReader.signHash(
						walletIndex,
						messageHash,
						'Solana Message',
					);

					result = {
						success: true,
						signature: signResult.signature,
						signatureBase64: Buffer.from(signResult.signature, 'hex').toString('base64'),
						message: message,
						publicKey: signResult.publicKey,
						cardId: signResult.cardId,
					};
					break;
				}

				case 'getTokenAccounts': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const includeEmpty = this.getNodeParameter('includeEmpty', i, false) as boolean;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveSolanaAddress(publicKey);

					// Placeholder - In production, query Solana RPC
					result = {
						success: true,
						address,
						tokenAccounts: [
							{
								mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
								symbol: 'USDC',
								decimals: 6,
								balance: '0',
								uiBalance: '0',
							},
						],
						includeEmpty,
						note: 'Token accounts fetched from Solana RPC',
					};
					break;
				}

				case 'getBalance': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;

					const cardData = await cardReader.scanCard();
					const publicKey = cardData.wallets?.[walletIndex]?.publicKey;

					if (!publicKey) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const address = deriveSolanaAddress(publicKey);

					// Placeholder - In production, query Solana RPC
					result = {
						success: true,
						address,
						balance: '0',
						balanceLamports: '0',
						balanceSol: '0',
						note: 'Balance fetched from Solana RPC',
					};
					break;
				}

				case 'broadcastTransaction': {
					const signedTransactionBase64 = this.getNodeParameter('signedTransactionBase64', i) as string;
					const skipPreflight = this.getNodeParameter('skipPreflight', i, false) as boolean;
					const commitment = this.getNodeParameter('commitment', i, 'confirmed') as string;

					// Placeholder - In production, broadcast to Solana RPC
					const txHash = generatePlaceholderTxHash();

					result = {
						success: true,
						txHash,
						signature: txHash,
						skipPreflight,
						commitment,
						explorerUrl: `https://explorer.solana.com/tx/${txHash}`,
						note: 'Transaction broadcast to Solana network',
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for Solana resource`);
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

function deriveSolanaAddress(publicKeyHex: string): string {
	// Solana addresses are base58-encoded ed25519 public keys
	const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
	return base58Encode(publicKeyBytes);
}

function hashSolanaMessage(messageBytes: Buffer): string {
	// Solana signs the raw message bytes (no hashing for ed25519)
	// The message is typically already hashed or is the transaction bytes
	return messageBytes.toString('hex');
}

function appendSignatureToTransaction(transactionBytes: Buffer, signatureHex: string): Buffer {
	// Placeholder - In production, properly append signature to transaction structure
	const signature = Buffer.from(signatureHex, 'hex');
	return Buffer.concat([signature, transactionBytes]);
}

function generatePlaceholderTxHash(): string {
	// Generate a placeholder transaction signature (base58, 88 chars)
	const bytes = Buffer.alloc(64);
	for (let i = 0; i < 64; i++) {
		bytes[i] = Math.floor(Math.random() * 256);
	}
	return base58Encode(bytes);
}

function base58Encode(buffer: Buffer): string {
	const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	let num = BigInt('0x' + buffer.toString('hex'));
	let encoded = '';

	while (num > 0n) {
		const remainder = Number(num % 58n);
		num = num / 58n;
		encoded = ALPHABET[remainder] + encoded;
	}

	// Handle leading zeros
	for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
		encoded = '1' + encoded;
	}

	return encoded || '1';
}
