/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { parseWalletInfo, canCreateWallet } from '../../utils/cardUtils';
import { EllipticCurve, getCurveForBlockchain } from '../../constants/curves';
import { getDerivationPathForChain, parseDerivationPath } from '../../constants/derivationPaths';

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
		case 'create': {
			const curveParam = this.getNodeParameter('curve', index, 'secp256k1') as string;
			const curve = curveParam as EllipticCurve;

			// First check if we can create a wallet
			const cardData = await cardReader.readCard();
			if (!cardData.success || !cardData.data) {
				result = { success: false, error: 'Failed to read card' };
				break;
			}

			const canCreate = canCreateWallet(cardData.data, curve);
			if (!canCreate) {
				result = {
					success: false,
					error: `Cannot create wallet with curve ${curve}. Card may be full or curve not supported.`,
				};
				break;
			}

			const createResult = await cardReader.createWallet(curve);
			if (createResult.success && createResult.data) {
				result = {
					success: true,
					wallet: {
						publicKey: createResult.data.publicKey,
						curve: createResult.data.curve,
						index: createResult.data.index,
						status: createResult.data.status,
					},
				};
			} else {
				result = { success: false, error: createResult.error || 'Failed to create wallet' };
			}
			break;
		}

		case 'getWallet': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const walletInfo = parseWalletInfo(walletResult.data);
				result = {
					success: true,
					wallet: {
						publicKey: walletInfo.publicKey,
						curve: walletInfo.curve,
						index: walletInfo.index,
						status: walletInfo.status,
						totalSignedHashes: walletInfo.totalSignedHashes,
						remainingSignatures: walletInfo.remainingSignatures,
						isHdWallet: walletInfo.isHdWallet,
						derivedKeys: walletInfo.derivedKeys,
					},
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
					curve: walletResult.data.curve,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getAddresses': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const walletInfo = parseWalletInfo(walletResult.data);
				const addresses: Record<string, string> = {};

				// Generate addresses for common chains based on curve
				const curve = walletInfo.curve;
				if (curve === EllipticCurve.Secp256k1) {
					// EVM address
					addresses.ethereum = deriveEvmAddress(walletInfo.publicKey);
					addresses.bitcoin = deriveBitcoinAddress(walletInfo.publicKey, 'mainnet');
				} else if (curve === EllipticCurve.Ed25519) {
					addresses.solana = deriveSolanaAddress(walletInfo.publicKey);
				}

				result = {
					success: true,
					publicKey: walletInfo.publicKey,
					curve: walletInfo.curve,
					addresses,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getStatus': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const walletInfo = parseWalletInfo(walletResult.data);
				result = {
					success: true,
					status: walletInfo.status,
					totalSignedHashes: walletInfo.totalSignedHashes,
					remainingSignatures: walletInfo.remainingSignatures,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'purge': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const purgeResult = await cardReader.purgeWallet(walletIndex);

			result = {
				success: purgeResult.success,
				message: purgeResult.success ? 'Wallet purged successfully' : purgeResult.error,
			};
			break;
		}

		case 'getIndex': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				result = {
					success: true,
					index: walletResult.data.index,
					publicKey: walletResult.data.publicKey,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getCurve': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const walletInfo = parseWalletInfo(walletResult.data);
				result = {
					success: true,
					curve: walletInfo.curve,
					curveDescription: getCurveDescription(walletInfo.curve),
					supportedBlockchains: getSupportedBlockchainsForCurve(walletInfo.curve),
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getSettings': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				result = {
					success: true,
					settings: {
						isReusable: walletResult.data.settings?.isReusable || false,
						prohibitPurge: walletResult.data.settings?.prohibitPurge || false,
						securityDelay: walletResult.data.settings?.securityDelay || 0,
					},
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'getHdInfo': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const walletResult = await cardReader.getWallet(walletIndex);

			if (walletResult.success && walletResult.data) {
				const walletInfo = parseWalletInfo(walletResult.data);
				result = {
					success: true,
					isHdWallet: walletInfo.isHdWallet,
					derivedKeys: walletInfo.derivedKeys || [],
					derivedKeyCount: walletInfo.derivedKeys?.length || 0,
				};
			} else {
				result = { success: false, error: walletResult.error || 'Wallet not found' };
			}
			break;
		}

		case 'deriveAddresses': {
			const walletIndex = this.getNodeParameter('walletIndex', index, 0) as number;
			const derivationPath = this.getNodeParameter('derivationPath', index, '') as string;

			const walletResult = await cardReader.getWallet(walletIndex);
			if (!walletResult.success || !walletResult.data) {
				result = { success: false, error: 'Wallet not found' };
				break;
			}

			const walletInfo = parseWalletInfo(walletResult.data);
			if (!walletInfo.isHdWallet) {
				result = { success: false, error: 'Wallet does not support HD derivation' };
				break;
			}

			const path = derivationPath || getDerivationPathForChain('ethereum');
			const derivedKey = await cardReader.deriveKey(walletIndex, path);

			if (derivedKey.success && derivedKey.data) {
				result = {
					success: true,
					derivedAddress: {
						path: path,
						publicKey: derivedKey.data.publicKey,
						chainCode: derivedKey.data.chainCode,
						address: deriveEvmAddress(derivedKey.data.publicKey),
					},
				};
			} else {
				result = { success: false, error: derivedKey.error || 'Failed to derive key' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

// Helper functions
function deriveEvmAddress(publicKey: string): string {
	// In production, use ethers.js to compute address from public key
	// This is a placeholder
	return `0x${publicKey.slice(-40)}`;
}

function deriveBitcoinAddress(publicKey: string, network: string): string {
	// In production, use bitcoinjs-lib
	return `btc_${publicKey.slice(0, 32)}`;
}

function deriveSolanaAddress(publicKey: string): string {
	// In production, use @solana/web3.js
	return publicKey;
}

function getCurveDescription(curve: EllipticCurve): string {
	const descriptions: Record<string, string> = {
		[EllipticCurve.Secp256k1]: 'Bitcoin/Ethereum curve (most common)',
		[EllipticCurve.Ed25519]: 'Edwards curve (Solana, Cardano)',
		[EllipticCurve.Secp256r1]: 'NIST P-256 curve',
		[EllipticCurve.Ed25519Slip0010]: 'Ed25519 with SLIP-0010 derivation',
		[EllipticCurve.Bls12381G2]: 'BLS curve for Ethereum 2.0',
		[EllipticCurve.Bip0340]: 'Schnorr signatures (Bitcoin Taproot)',
	};
	return descriptions[curve] || 'Unknown curve';
}

function getSupportedBlockchainsForCurve(curve: EllipticCurve): string[] {
	const blockchains: Record<string, string[]> = {
		[EllipticCurve.Secp256k1]: ['Bitcoin', 'Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'],
		[EllipticCurve.Ed25519]: ['Solana', 'Cardano', 'Stellar', 'Polkadot', 'Near'],
		[EllipticCurve.Secp256r1]: ['Custom chains'],
		[EllipticCurve.Ed25519Slip0010]: ['Solana', 'Cardano'],
		[EllipticCurve.Bls12381G2]: ['Ethereum 2.0'],
		[EllipticCurve.Bip0340]: ['Bitcoin (Taproot)'],
	};
	return blockchains[curve] || [];
}
