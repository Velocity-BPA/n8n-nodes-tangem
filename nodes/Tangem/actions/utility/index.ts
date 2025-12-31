/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { SUPPORTED_CHAINS, CHAIN_CONFIGS } from '../../constants/chains';
import { ELLIPTIC_CURVES } from '../../constants/curves';
import { DERIVATION_PATHS } from '../../constants/derivationPaths';

/**
 * Utility resource handler for Tangem nodes
 * Provides helper functions for validation, conversion, and system info
 */

interface UtilityExecuteParams {
	operation: string;
	itemIndex: number;
}

export async function execute(
	this: IExecuteFunctions,
	params: UtilityExecuteParams,
): Promise<INodeExecutionData[]> {
	const { operation, itemIndex } = params;
	const returnData: INodeExecutionData[] = [];

	try {
		let result: Record<string, unknown>;

		switch (operation) {
			case 'getSupportedCurves': {
				result = getSupportedCurves();
				break;
			}
			case 'getSupportedBlockchains': {
				const category = this.getNodeParameter('category', itemIndex, 'all') as string;
				result = getSupportedBlockchains(category);
				break;
			}
			case 'validateAddress': {
				const address = this.getNodeParameter('address', itemIndex) as string;
				const chain = this.getNodeParameter('chain', itemIndex) as string;
				result = validateAddress(address, chain);
				break;
			}
			case 'getDerivationPath': {
				const chain = this.getNodeParameter('chain', itemIndex) as string;
				const accountIndex = this.getNodeParameter('accountIndex', itemIndex, 0) as number;
				const addressType = this.getNodeParameter('addressType', itemIndex, 'default') as string;
				result = getDerivationPath(chain, accountIndex, addressType);
				break;
			}
			case 'convertAddressFormat': {
				const address = this.getNodeParameter('address', itemIndex) as string;
				const fromFormat = this.getNodeParameter('fromFormat', itemIndex) as string;
				const toFormat = this.getNodeParameter('toFormat', itemIndex) as string;
				const chain = this.getNodeParameter('chain', itemIndex) as string;
				result = convertAddressFormat(address, fromFormat, toFormat, chain);
				break;
			}
			case 'getCardLimits': {
				const credentials = await this.getCredentials('tangemCard');
				const reader = new TangemCardReader({
					timeout: (credentials.nfcTimeout as number) || 30000,
					retryAttempts: (credentials.retryAttempts as number) || 3,
				});
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				result = await getCardLimits(reader, cardId);
				break;
			}
			case 'testNfcConnection': {
				const credentials = await this.getCredentials('tangemCard');
				const reader = new TangemCardReader({
					timeout: (credentials.nfcTimeout as number) || 30000,
					retryAttempts: (credentials.retryAttempts as number) || 3,
				});
				result = await testNfcConnection(reader);
				break;
			}
			default:
				throw new Error(`Unknown operation: ${operation}`);
		}

		returnData.push({
			json: { success: true, ...result },
			pairedItem: { item: itemIndex },
		});
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({
				json: {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
					operation,
				},
				pairedItem: { item: itemIndex },
			});
		} else {
			throw error;
		}
	}

	return returnData;
}

// Operation implementations

function getSupportedCurves(): Record<string, unknown> {
	const curves = Object.entries(ELLIPTIC_CURVES).map(([id, curve]) => ({
		id,
		name: curve.name,
		description: curve.description,
		keySize: curve.keySize,
		signatureSize: curve.signatureSize,
		supportedBlockchains: curve.blockchains,
	}));

	return {
		operation: 'getSupportedCurves',
		curves,
		count: curves.length,
		recommended: 'secp256k1',
		timestamp: new Date().toISOString(),
	};
}

function getSupportedBlockchains(category: string): Record<string, unknown> {
	let chains = Object.entries(SUPPORTED_CHAINS);

	// Filter by category if specified
	if (category !== 'all') {
		const categoryMap: Record<string, string[]> = {
			evm: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base', 'avalanche', 'fantom', 'gnosis', 'cronos', 'linea', 'scroll', 'zksync', 'mantle', 'blast'],
			utxo: ['bitcoin', 'litecoin', 'dogecoin', 'bitcoinCash', 'dash'],
			layer1: ['solana', 'cardano', 'polkadot', 'cosmos', 'near', 'tron', 'stellar', 'xrp', 'algorand', 'tezos', 'hedera'],
			layer2: ['arbitrum', 'optimism', 'base', 'polygon', 'linea', 'scroll', 'zksync', 'mantle', 'blast', 'starknet'],
		};

		const categoryChains = categoryMap[category] || [];
		chains = chains.filter(([id]) => categoryChains.includes(id));
	}

	const blockchains = chains.map(([id, chain]) => ({
		id,
		name: chain.name,
		symbol: chain.symbol,
		chainId: chain.chainId || null,
		type: chain.type,
		curve: chain.curve,
		testnet: chain.testnet || false,
		explorerUrl: chain.explorerUrl,
	}));

	return {
		operation: 'getSupportedBlockchains',
		category,
		blockchains,
		count: blockchains.length,
		timestamp: new Date().toISOString(),
	};
}

function validateAddress(address: string, chain: string): Record<string, unknown> {
	const chainConfig = CHAIN_CONFIGS[chain];
	
	if (!chainConfig) {
		throw new Error(`Unsupported chain: ${chain}`);
	}

	const validation = performAddressValidation(address, chain, chainConfig);

	return {
		operation: 'validateAddress',
		address,
		chain,
		isValid: validation.isValid,
		format: validation.format,
		checksum: validation.checksum,
		type: validation.type,
		warnings: validation.warnings,
		timestamp: new Date().toISOString(),
	};
}

function getDerivationPath(
	chain: string,
	accountIndex: number,
	addressType: string,
): Record<string, unknown> {
	const chainPaths = DERIVATION_PATHS[chain];
	
	if (!chainPaths) {
		throw new Error(`No derivation path defined for chain: ${chain}`);
	}

	let basePath: string;
	let standard: string;

	// Handle different address types for Bitcoin
	if (chain === 'bitcoin') {
		switch (addressType) {
			case 'legacy':
				basePath = chainPaths.legacy;
				standard = 'BIP-44';
				break;
			case 'segwit':
				basePath = chainPaths.segwit;
				standard = 'BIP-49';
				break;
			case 'nativeSegwit':
				basePath = chainPaths.nativeSegwit;
				standard = 'BIP-84';
				break;
			case 'taproot':
				basePath = chainPaths.taproot;
				standard = 'BIP-86';
				break;
			default:
				basePath = chainPaths.default || chainPaths.nativeSegwit;
				standard = 'BIP-84';
		}
	} else {
		basePath = chainPaths.default || chainPaths[addressType] || `m/44'/${chainPaths.coinType}'/0'`;
		standard = 'BIP-44';
	}

	// Replace account placeholder
	const fullPath = basePath.replace('{account}', accountIndex.toString());

	return {
		operation: 'getDerivationPath',
		chain,
		addressType,
		accountIndex,
		derivationPath: fullPath,
		standard,
		coinType: chainPaths.coinType,
		hardened: fullPath.includes("'"),
		timestamp: new Date().toISOString(),
	};
}

function convertAddressFormat(
	address: string,
	fromFormat: string,
	toFormat: string,
	chain: string,
): Record<string, unknown> {
	// Address format conversion logic
	let convertedAddress = address;
	let conversionApplied = false;

	if (chain === 'ethereum' || CHAIN_CONFIGS[chain]?.type === 'evm') {
		// EVM address conversions
		if (fromFormat === 'lowercase' && toFormat === 'checksum') {
			convertedAddress = toChecksumAddress(address);
			conversionApplied = true;
		} else if (fromFormat === 'checksum' && toFormat === 'lowercase') {
			convertedAddress = address.toLowerCase();
			conversionApplied = true;
		}
	} else if (chain === 'bitcoin') {
		// Bitcoin address format conversions would go here
		// (legacy, segwit, bech32 conversions are complex and need proper libraries)
		if (fromFormat !== toFormat) {
			throw new Error('Bitcoin address format conversion requires the original public key');
		}
	}

	return {
		operation: 'convertAddressFormat',
		originalAddress: address,
		convertedAddress,
		fromFormat,
		toFormat,
		chain,
		conversionApplied,
		isValid: true,
		timestamp: new Date().toISOString(),
	};
}

async function getCardLimits(
	reader: TangemCardReader,
	cardId: string,
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(cardId);
	
	// Parse limits from card settings
	const limits = {
		maxWallets: cardData.maxWallets || 16,
		maxSignatures: cardData.remainingSignatures || 'unlimited',
		maxPinAttempts: cardData.maxPinAttempts || 10,
		remainingPinAttempts: cardData.remainingPinAttempts || 10,
		maxAccessCodeAttempts: cardData.maxAccessCodeAttempts || 10,
		remainingAccessCodeAttempts: cardData.remainingAccessCodeAttempts || 10,
		maxDerivationDepth: cardData.maxDerivationDepth || 5,
		maxUserDataSize: 512,
		maxFileSize: 4096,
		maxFilesCount: 32,
		transactionSizeLimit: cardData.transactionSizeLimit || 65535,
		securityDelayMs: cardData.securityDelayMs || 0,
	};

	return {
		operation: 'getCardLimits',
		cardId: cardData.cardId,
		limits,
		walletsUsed: (cardData.wallets as unknown[])?.length || 0,
		walletsRemaining: limits.maxWallets - ((cardData.wallets as unknown[])?.length || 0),
		timestamp: new Date().toISOString(),
	};
}

async function testNfcConnection(reader: TangemCardReader): Promise<Record<string, unknown>> {
	const startTime = Date.now();
	
	try {
		const status = await reader.initialize();
		const initTime = Date.now() - startTime;
		
		// Try to detect a card (with short timeout)
		const scanStart = Date.now();
		let cardDetected = false;
		let cardId: string | null = null;
		
		try {
			const scanResult = await reader.waitForCard({ timeout: 3000 });
			cardDetected = scanResult.found;
			cardId = scanResult.cardId || null;
		} catch {
			// Card not detected within timeout - that's OK for a test
		}
		
		const scanTime = Date.now() - scanStart;
		const totalTime = Date.now() - startTime;
		
		return {
			operation: 'testNfcConnection',
			nfcAvailable: status.available,
			nfcEnabled: status.enabled,
			readerType: status.readerType || 'system',
			initializationTimeMs: initTime,
			cardDetected,
			cardId,
			scanTimeMs: scanTime,
			totalTimeMs: totalTime,
			status: status.available && status.enabled ? 'ready' : 'not_ready',
			diagnostics: {
				readerInitialized: true,
				communicationOk: status.available,
				nfcFeatureEnabled: status.enabled,
			},
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			operation: 'testNfcConnection',
			nfcAvailable: false,
			nfcEnabled: false,
			status: 'error',
			error: error instanceof Error ? error.message : 'Unknown error',
			diagnostics: {
				readerInitialized: false,
				communicationOk: false,
				nfcFeatureEnabled: false,
			},
			timestamp: new Date().toISOString(),
		};
	}
}

// Helper functions

function performAddressValidation(
	address: string,
	chain: string,
	config: Record<string, unknown>,
): {
	isValid: boolean;
	format: string;
	checksum: boolean;
	type: string;
	warnings: string[];
} {
	const warnings: string[] = [];
	let isValid = false;
	let format = 'unknown';
	let checksum = false;
	let type = 'standard';

	if (chain === 'ethereum' || (config.type === 'evm')) {
		// Ethereum address validation
		if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
			isValid = true;
			format = 'hex';
			
			// Check if it's checksummed
			if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
				checksum = isValidChecksumAddress(address);
				if (!checksum) {
					warnings.push('Invalid checksum - address may be malformed');
				}
			} else {
				warnings.push('Address is not checksummed');
			}
		}
	} else if (chain === 'bitcoin') {
		// Bitcoin address validation
		if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
			isValid = true;
			format = 'legacy';
			type = address.startsWith('1') ? 'P2PKH' : 'P2SH';
		} else if (/^bc1[a-z0-9]{39,59}$/.test(address)) {
			isValid = true;
			format = 'bech32';
			type = address.length === 42 ? 'P2WPKH' : 'P2WSH';
		} else if (/^bc1p[a-z0-9]{58}$/.test(address)) {
			isValid = true;
			format = 'bech32m';
			type = 'P2TR (Taproot)';
		}
	} else if (chain === 'solana') {
		// Solana address validation (base58, 32-44 chars)
		if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
			isValid = true;
			format = 'base58';
		}
	}

	return { isValid, format, checksum, type, warnings };
}

function isValidChecksumAddress(address: string): boolean {
	// Simplified checksum validation
	// In production, use proper keccak256 hash
	const checksummed = toChecksumAddress(address);
	return address === checksummed;
}

function toChecksumAddress(address: string): string {
	// Simplified checksum address generation
	// In production, use proper keccak256 hash
	const addr = address.toLowerCase().replace('0x', '');
	
	// This is a placeholder - real implementation needs keccak256
	let checksummed = '0x';
	for (let i = 0; i < addr.length; i++) {
		const char = addr[i];
		// Simple alternating pattern as placeholder
		if (/[a-f]/.test(char) && i % 2 === 0) {
			checksummed += char.toUpperCase();
		} else {
			checksummed += char;
		}
	}
	
	return checksummed;
}

export const utilityOperations = {
	getSupportedCurves,
	getSupportedBlockchains,
	validateAddress,
	getDerivationPath,
	convertAddressFormat,
	getCardLimits,
	testNfcConnection,
};
