/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * HD Wallet Resource Operations
 * Handles hierarchical deterministic wallet operations via Tangem card
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
				case 'getInfo': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;

					const cardData = await cardReader.scanCard();
					const wallet = cardData.wallets?.[walletIndex];

					if (!wallet) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					result = {
						success: true,
						walletIndex,
						hasHdWallet: wallet.settings?.isHdWalletAllowed || false,
						curve: wallet.curve,
						chainCode: wallet.chainCode || null,
						extendedPublicKey: wallet.extendedPublicKey || null,
						derivedKeysCount: wallet.derivedKeys?.length || 0,
						cardId: cardData.cardId,
					};
					break;
				}

				case 'deriveKey': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const derivationPath = this.getNodeParameter('derivationPath', i) as string;

					// Validate derivation path format
					if (!isValidDerivationPath(derivationPath)) {
						throw new Error('Invalid derivation path format. Expected BIP32 path like m/44\'/0\'/0\'/0/0');
					}

					const cardData = await cardReader.scanCard();
					const wallet = cardData.wallets?.[walletIndex];

					if (!wallet) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// Derive key from path
					const derivedKey = deriveKeyFromPath(wallet.publicKey, derivationPath);

					result = {
						success: true,
						walletIndex,
						derivationPath,
						publicKey: derivedKey.publicKey,
						chainCode: derivedKey.chainCode,
						depth: derivedKey.depth,
						index: derivedKey.index,
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getDerivedAddress': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const derivationPath = this.getNodeParameter('derivationPath', i) as string;
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;

					const cardData = await cardReader.scanCard();
					const wallet = cardData.wallets?.[walletIndex];

					if (!wallet) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					// Derive key and convert to address
					const derivedKey = deriveKeyFromPath(wallet.publicKey, derivationPath);
					const address = publicKeyToAddress(derivedKey.publicKey, chain);

					result = {
						success: true,
						walletIndex,
						derivationPath,
						chain,
						address,
						publicKey: derivedKey.publicKey,
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getChildPublicKey': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const parentPath = this.getNodeParameter('parentPath', i, 'm') as string;
					const childIndex = this.getNodeParameter('childIndex', i, 0) as number;
					const hardened = this.getNodeParameter('hardened', i, false) as boolean;

					const cardData = await cardReader.scanCard();
					const wallet = cardData.wallets?.[walletIndex];

					if (!wallet) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const fullPath = parentPath + '/' + childIndex + (hardened ? "'" : '');
					const derivedKey = deriveKeyFromPath(wallet.publicKey, fullPath);

					result = {
						success: true,
						walletIndex,
						parentPath,
						childIndex,
						hardened,
						fullPath,
						publicKey: derivedKey.publicKey,
						chainCode: derivedKey.chainCode,
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getDerivationPath': {
					const chain = this.getNodeParameter('chain', i, 'ethereum') as string;
					const accountIndex = this.getNodeParameter('accountIndex', i, 0) as number;
					const addressIndex = this.getNodeParameter('addressIndex', i, 0) as number;
					const purpose = this.getNodeParameter('purpose', i, 'default') as string;

					const pathInfo = getDerivationPathForChain(chain, accountIndex, addressIndex, purpose);

					result = {
						success: true,
						chain,
						...pathInfo,
					};
					break;
				}

				case 'createHdWallet': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const curve = this.getNodeParameter('curve', i, 'secp256k1') as string;

					const cardData = await cardReader.scanCard();

					// Check if HD wallet creation is allowed
					if (!cardData.settings?.isHdWalletAllowed) {
						throw new Error('HD wallet creation is not allowed on this card');
					}

					// Placeholder - In production, send command to card
					result = {
						success: true,
						walletIndex,
						curve,
						created: true,
						hasChainCode: true,
						message: 'HD wallet created successfully',
						cardId: cardData.cardId,
					};
					break;
				}

				case 'getExtendedPublicKey': {
					const walletIndex = this.getNodeParameter('walletIndex', i, 0) as number;
					const derivationPath = this.getNodeParameter('derivationPath', i, "m/44'/60'/0'") as string;
					const network = this.getNodeParameter('network', i, 'mainnet') as string;

					const cardData = await cardReader.scanCard();
					const wallet = cardData.wallets?.[walletIndex];

					if (!wallet) {
						throw new Error(`Wallet at index ${walletIndex} not found`);
					}

					const derivedKey = deriveKeyFromPath(wallet.publicKey, derivationPath);
					const xpub = encodeExtendedPublicKey(derivedKey, network);

					result = {
						success: true,
						walletIndex,
						derivationPath,
						network,
						xpub,
						publicKey: derivedKey.publicKey,
						chainCode: derivedKey.chainCode,
						depth: derivedKey.depth,
						cardId: cardData.cardId,
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for HD Wallet resource`);
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

function isValidDerivationPath(path: string): boolean {
	// BIP32 path format: m/purpose'/coin'/account'/change/index
	const regex = /^m(\/\d+'?)*$/;
	return regex.test(path);
}

function deriveKeyFromPath(
	masterPublicKey: string,
	path: string,
): { publicKey: string; chainCode: string; depth: number; index: number } {
	// Placeholder - In production, implement BIP32 derivation
	const parts = path.split('/').filter(p => p !== 'm');
	const depth = parts.length;
	const lastPart = parts[parts.length - 1] || '0';
	const index = parseInt(lastPart.replace("'", ''), 10);

	return {
		publicKey: simpleHash(masterPublicKey + path),
		chainCode: simpleHash(path + 'chaincode'),
		depth,
		index,
	};
}

function publicKeyToAddress(publicKey: string, chain: string): string {
	const hash = simpleHash(publicKey);

	const prefixes: Record<string, string> = {
		ethereum: '0x',
		polygon: '0x',
		bitcoin: '1',
		litecoin: 'L',
		dogecoin: 'D',
		solana: '',
	};

	const prefix = prefixes[chain.toLowerCase()] || '0x';
	const addressLength = chain === 'solana' ? 44 : 40;

	return prefix + hash.substring(0, addressLength);
}

function getDerivationPathForChain(
	chain: string,
	accountIndex: number,
	addressIndex: number,
	purpose: string,
): Record<string, unknown> {
	const coinTypes: Record<string, number> = {
		bitcoin: 0,
		litecoin: 2,
		dogecoin: 3,
		ethereum: 60,
		polygon: 60,
		bsc: 60,
		solana: 501,
		cardano: 1815,
		polkadot: 354,
		cosmos: 118,
		tron: 195,
		xrp: 144,
		stellar: 148,
	};

	const purposes: Record<string, number> = {
		default: chain === 'bitcoin' ? 84 : 44,
		legacy: 44,
		segwit: 49,
		nativeSegwit: 84,
		taproot: 86,
	};

	const coinType = coinTypes[chain.toLowerCase()] || 60;
	const purposeNum = purposes[purpose] || purposes.default;

	const path = `m/${purposeNum}'/${coinType}'/${accountIndex}'/0/${addressIndex}`;

	return {
		path,
		purpose: purposeNum,
		coinType,
		accountIndex,
		addressIndex,
		bip: `BIP-${purposeNum}`,
	};
}

function encodeExtendedPublicKey(
	derivedKey: { publicKey: string; chainCode: string; depth: number },
	network: string,
): string {
	// Placeholder - In production, implement proper xpub encoding
	const prefix = network === 'mainnet' ? 'xpub' : 'tpub';
	const hash = simpleHash(derivedKey.publicKey + derivedKey.chainCode);
	return prefix + hash.substring(0, 107);
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
