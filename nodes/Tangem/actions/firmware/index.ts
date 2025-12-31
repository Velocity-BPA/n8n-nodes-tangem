/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { CARD_GENERATIONS, FIRMWARE_FEATURES } from '../../constants/cardVersions';

/**
 * Firmware resource handler for Tangem nodes
 * Handles firmware version checking, capabilities, and card generation info
 */

interface FirmwareExecuteParams {
	operation: string;
	itemIndex: number;
}

export async function execute(
	this: IExecuteFunctions,
	params: FirmwareExecuteParams,
): Promise<INodeExecutionData[]> {
	const { operation, itemIndex } = params;
	const returnData: INodeExecutionData[] = [];

	const credentials = await this.getCredentials('tangemCard');
	const reader = new TangemCardReader({
		timeout: (credentials.nfcTimeout as number) || 30000,
		retryAttempts: (credentials.retryAttempts as number) || 3,
	});

	try {
		let result: Record<string, unknown>;

		switch (operation) {
			case 'getFirmwareVersion': {
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				result = await getFirmwareVersion(reader, cardId);
				break;
			}
			case 'checkForUpdates': {
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				result = await checkForUpdates(reader, cardId);
				break;
			}
			case 'getCardGeneration': {
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				result = await getCardGeneration(reader, cardId);
				break;
			}
			case 'getBatchInfo': {
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				result = await getBatchInfo(reader, cardId);
				break;
			}
			case 'getCapabilities': {
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				result = await getCapabilities(reader, cardId);
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

async function getFirmwareVersion(
	reader: TangemCardReader,
	cardId: string,
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(cardId);
	const firmwareString = cardData.firmwareVersion || '0.0.0';
	
	// Parse firmware version
	const versionParts = firmwareString.split('.').map((p: string) => parseInt(p, 10) || 0);
	const [major, minor, patch] = versionParts;
	
	// Determine generation from firmware
	const generation = determineGeneration(major, minor);
	
	return {
		operation: 'getFirmwareVersion',
		cardId: cardData.cardId,
		firmwareVersion: firmwareString,
		versionParts: {
			major,
			minor,
			patch: patch || 0,
		},
		generation,
		releaseDate: getReleaseDate(firmwareString),
		isLatest: isLatestFirmware(firmwareString, generation),
		timestamp: new Date().toISOString(),
	};
}

async function checkForUpdates(
	reader: TangemCardReader,
	cardId: string,
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(cardId);
	const currentVersion = cardData.firmwareVersion || '0.0.0';
	const generation = determineGeneration(
		parseInt(currentVersion.split('.')[0], 10) || 0,
		parseInt(currentVersion.split('.')[1], 10) || 0,
	);
	
	// Latest firmware versions per generation (placeholder values)
	const latestVersions: Record<string, string> = {
		'1': '1.19.0',
		'2': '2.61.0',
		'3': '3.42.0',
		'4': '4.55.0',
		'5': '5.10.0',
		'6': '6.35.0',
	};
	
	const latestVersion = latestVersions[generation] || currentVersion;
	const updateAvailable = compareVersions(currentVersion, latestVersion) < 0;
	
	return {
		operation: 'checkForUpdates',
		cardId: cardData.cardId,
		currentVersion,
		latestVersion,
		generation,
		updateAvailable,
		updateNotes: updateAvailable ? 'Security improvements and bug fixes' : null,
		canUpdateOverNfc: generation >= '4',
		timestamp: new Date().toISOString(),
	};
}

async function getCardGeneration(
	reader: TangemCardReader,
	cardId: string,
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(cardId);
	const firmwareString = cardData.firmwareVersion || '0.0.0';
	const major = parseInt(firmwareString.split('.')[0], 10) || 0;
	const minor = parseInt(firmwareString.split('.')[1], 10) || 0;
	
	const generation = determineGeneration(major, minor);
	const genInfo = CARD_GENERATIONS[generation] || CARD_GENERATIONS['unknown'];
	
	return {
		operation: 'getCardGeneration',
		cardId: cardData.cardId,
		generation,
		generationName: genInfo.name,
		releaseYear: genInfo.releaseYear,
		chipType: genInfo.chipType,
		secureElement: genInfo.secureElement,
		maxWallets: genInfo.maxWallets,
		supportedCurves: genInfo.supportedCurves,
		hdWalletSupport: genInfo.hdWalletSupport,
		backupSupport: genInfo.backupSupport,
		attestation: genInfo.attestation,
		timestamp: new Date().toISOString(),
	};
}

async function getBatchInfo(
	reader: TangemCardReader,
	cardId: string,
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(cardId);
	const batchId = cardData.batchId || 'unknown';
	
	// Parse batch ID (format varies by manufacturer)
	const batchInfo = parseBatchId(batchId);
	
	return {
		operation: 'getBatchInfo',
		cardId: cardData.cardId,
		batchId,
		manufacturingDate: batchInfo.date,
		manufacturingLocation: batchInfo.location,
		batchSize: batchInfo.batchSize,
		productLine: batchInfo.productLine,
		cardType: determineCardType(cardData),
		serialNumber: cardData.cardPublicKey?.slice(0, 16) || 'unknown',
		timestamp: new Date().toISOString(),
	};
}

async function getCapabilities(
	reader: TangemCardReader,
	cardId: string,
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(cardId);
	const firmwareString = cardData.firmwareVersion || '0.0.0';
	const major = parseInt(firmwareString.split('.')[0], 10) || 0;
	const minor = parseInt(firmwareString.split('.')[1], 10) || 0;
	
	const generation = determineGeneration(major, minor);
	const features = FIRMWARE_FEATURES[generation] || FIRMWARE_FEATURES['default'];
	
	// Parse settings mask for actual capabilities
	const settingsMask = cardData.settingsMask || 0;
	
	return {
		operation: 'getCapabilities',
		cardId: cardData.cardId,
		firmwareVersion: firmwareString,
		generation,
		capabilities: {
			// Cryptographic capabilities
			supportedCurves: features.supportedCurves,
			maxSigningAttempts: features.maxSigningAttempts,
			signHashCommands: features.signHashCommands,
			
			// Wallet capabilities
			maxWallets: features.maxWallets,
			hdWalletSupport: features.hdWalletSupport,
			derivationPathDepth: features.derivationPathDepth,
			
			// Security capabilities
			pinSupport: (settingsMask & 0x0001) !== 0,
			pin2Support: (settingsMask & 0x0002) !== 0,
			accessCodeSupport: features.accessCodeSupport,
			passcodeSupport: features.passcodeSupport,
			securityDelaySupport: features.securityDelaySupport,
			
			// Backup capabilities
			backupSupport: features.backupSupport,
			maxBackupCards: features.maxBackupCards,
			
			// File capabilities
			filesSupport: features.filesSupport,
			maxFileSize: features.maxFileSize,
			
			// Attestation
			attestationSupport: features.attestationSupport,
			attestationType: features.attestationType,
			
			// Communication
			extendedApduSupport: features.extendedApduSupport,
			maxTransactionSize: features.maxTransactionSize,
		},
		settingsMask: settingsMask.toString(16).toUpperCase().padStart(8, '0'),
		isActivated: cardData.isActivated,
		timestamp: new Date().toISOString(),
	};
}

// Helper functions

function determineGeneration(major: number, minor: number): string {
	// Tangem card generations based on firmware major version
	if (major >= 6) return '6';
	if (major >= 5) return '5';
	if (major >= 4) return '4';
	if (major >= 3) return '3';
	if (major >= 2) return '2';
	if (major >= 1) return '1';
	return 'unknown';
}

function getReleaseDate(firmwareVersion: string): string | null {
	// Placeholder - in production, this would lookup actual release dates
	const releases: Record<string, string> = {
		'6.35': '2024-10-01',
		'6.30': '2024-07-01',
		'5.10': '2024-03-01',
		'4.55': '2023-12-01',
		'3.42': '2023-06-01',
	};
	
	const majorMinor = firmwareVersion.split('.').slice(0, 2).join('.');
	return releases[majorMinor] || null;
}

function isLatestFirmware(version: string, generation: string): boolean {
	const latestVersions: Record<string, string> = {
		'1': '1.19.0',
		'2': '2.61.0',
		'3': '3.42.0',
		'4': '4.55.0',
		'5': '5.10.0',
		'6': '6.35.0',
	};
	
	const latest = latestVersions[generation];
	if (!latest) return false;
	
	return compareVersions(version, latest) >= 0;
}

function compareVersions(v1: string, v2: string): number {
	const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
	const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);
	
	for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
		const p1 = parts1[i] || 0;
		const p2 = parts2[i] || 0;
		if (p1 < p2) return -1;
		if (p1 > p2) return 1;
	}
	
	return 0;
}

function parseBatchId(batchId: string): {
	date: string | null;
	location: string | null;
	batchSize: number | null;
	productLine: string;
} {
	// Batch ID parsing (format varies)
	// Example: TANGEM-2024-01-EU-1000
	const parts = batchId.split('-');
	
	if (parts.length >= 4) {
		return {
			date: `${parts[1]}-${parts[2]}-01`,
			location: parts[3],
			batchSize: parseInt(parts[4], 10) || null,
			productLine: parts[0],
		};
	}
	
	return {
		date: null,
		location: null,
		batchSize: null,
		productLine: batchId,
	};
}

function determineCardType(cardData: Record<string, unknown>): string {
	const settingsMask = (cardData.settingsMask as number) || 0;
	const walletCount = (cardData.wallets as unknown[])?.length || 0;
	
	// Determine card type from characteristics
	if (settingsMask & 0x8000) return 'Tangem Ring';
	if (walletCount === 1 && (settingsMask & 0x0100)) return 'Tangem Note';
	if (cardData.hasBackupCards) return 'Tangem Wallet 2.0';
	if (walletCount > 1) return 'Tangem Wallet';
	
	return 'Tangem Card';
}

export const firmwareOperations = {
	getFirmwareVersion,
	checkForUpdates,
	getCardGeneration,
	getBatchInfo,
	getCapabilities,
};
