/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * NFC resource handler for Tangem nodes
 * Handles NFC communication, session management, and reader operations
 */

interface NfcExecuteParams {
	operation: string;
	itemIndex: number;
}

export async function execute(
	this: IExecuteFunctions,
	params: NfcExecuteParams,
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
			case 'initialize': {
				result = await initializeNfc(reader);
				break;
			}
			case 'scanForCard': {
				const timeout = this.getNodeParameter('timeout', itemIndex, 30000) as number;
				const vibrate = this.getNodeParameter('vibrate', itemIndex, true) as boolean;
				result = await scanForCard(reader, { timeout, vibrate });
				break;
			}
			case 'readCard': {
				const cardId = this.getNodeParameter('cardId', itemIndex, '') as string;
				const readWallets = this.getNodeParameter('readWallets', itemIndex, true) as boolean;
				result = await readCard(reader, { cardId, readWallets });
				break;
			}
			case 'writeToCard': {
				const cardId = this.getNodeParameter('cardId', itemIndex) as string;
				const data = this.getNodeParameter('data', itemIndex) as string;
				const dataType = this.getNodeParameter('dataType', itemIndex, 'userData') as string;
				result = await writeToCard(reader, { cardId, data, dataType });
				break;
			}
			case 'getStatus': {
				result = await getNfcStatus(reader);
				break;
			}
			case 'setTimeout': {
				const timeout = this.getNodeParameter('timeout', itemIndex) as number;
				result = await setNfcTimeout(reader, timeout);
				break;
			}
			case 'cancelOperation': {
				result = await cancelNfcOperation(reader);
				break;
			}
			case 'getReaderInfo': {
				result = await getReaderInfo(reader);
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

async function initializeNfc(reader: TangemCardReader): Promise<Record<string, unknown>> {
	const status = await reader.initialize();
	
	return {
		operation: 'initialize',
		initialized: true,
		nfcAvailable: status.available,
		nfcEnabled: status.enabled,
		readerType: status.readerType || 'system',
		supportedTechnologies: ['NFC-A', 'NFC-B', 'NFC-F', 'NFC-V', 'ISO-DEP'],
		timestamp: new Date().toISOString(),
	};
}

async function scanForCard(
	reader: TangemCardReader,
	options: { timeout: number; vibrate: boolean },
): Promise<Record<string, unknown>> {
	const startTime = Date.now();
	
	// Placeholder for actual NFC scanning
	const scanResult = await reader.waitForCard({
		timeout: options.timeout,
		vibrate: options.vibrate,
	});
	
	const scanTime = Date.now() - startTime;
	
	if (scanResult.found) {
		return {
			operation: 'scanForCard',
			found: true,
			cardId: scanResult.cardId,
			cardType: scanResult.cardType || 'unknown',
			signalStrength: scanResult.signalStrength || -40,
			scanTimeMs: scanTime,
			timestamp: new Date().toISOString(),
		};
	}
	
	return {
		operation: 'scanForCard',
		found: false,
		scanTimeMs: scanTime,
		reason: 'timeout',
		timestamp: new Date().toISOString(),
	};
}

async function readCard(
	reader: TangemCardReader,
	options: { cardId: string; readWallets: boolean },
): Promise<Record<string, unknown>> {
	const cardData = await reader.readCard(options.cardId, {
		readWallets: options.readWallets,
	});
	
	return {
		operation: 'readCard',
		cardId: cardData.cardId,
		firmwareVersion: cardData.firmwareVersion,
		manufacturerName: cardData.manufacturerName || 'Tangem',
		cardPublicKey: cardData.cardPublicKey,
		walletCount: options.readWallets ? (cardData.wallets?.length || 0) : undefined,
		wallets: options.readWallets ? cardData.wallets?.map((w: Record<string, unknown>, idx: number) => ({
			index: idx,
			publicKey: w.publicKey,
			curve: w.curve,
			hasBackup: w.hasBackup || false,
		})) : undefined,
		settingsMask: cardData.settingsMask,
		isActivated: cardData.isActivated,
		timestamp: new Date().toISOString(),
	};
}

async function writeToCard(
	reader: TangemCardReader,
	options: { cardId: string; data: string; dataType: string },
): Promise<Record<string, unknown>> {
	// Tangem cards have limited writable areas
	const validDataTypes = ['userData', 'issuerData', 'files'];
	
	if (!validDataTypes.includes(options.dataType)) {
		throw new Error(`Invalid data type: ${options.dataType}. Valid types: ${validDataTypes.join(', ')}`);
	}
	
	const dataBuffer = Buffer.from(options.data);
	
	// Check data size limits
	const maxSizes: Record<string, number> = {
		userData: 512,
		issuerData: 512,
		files: 4096,
	};
	
	if (dataBuffer.length > maxSizes[options.dataType]) {
		throw new Error(`Data exceeds maximum size for ${options.dataType}: ${maxSizes[options.dataType]} bytes`);
	}
	
	const writeResult = await reader.writeData(options.cardId, {
		dataType: options.dataType,
		data: dataBuffer,
	});
	
	return {
		operation: 'writeToCard',
		cardId: options.cardId,
		dataType: options.dataType,
		bytesWritten: dataBuffer.length,
		success: writeResult.success,
		timestamp: new Date().toISOString(),
	};
}

async function getNfcStatus(reader: TangemCardReader): Promise<Record<string, unknown>> {
	const status = await reader.getStatus();
	
	return {
		operation: 'getStatus',
		nfcAvailable: status.available,
		nfcEnabled: status.enabled,
		isScanning: status.isScanning || false,
		currentSession: status.sessionId || null,
		lastCardId: status.lastCardId || null,
		errorCount: status.errorCount || 0,
		uptime: status.uptime || 0,
		readerState: status.readerState || 'idle',
		timestamp: new Date().toISOString(),
	};
}

async function setNfcTimeout(reader: TangemCardReader, timeout: number): Promise<Record<string, unknown>> {
	// Validate timeout range
	if (timeout < 1000 || timeout > 120000) {
		throw new Error('Timeout must be between 1000ms and 120000ms');
	}
	
	reader.setTimeout(timeout);
	
	return {
		operation: 'setTimeout',
		timeoutMs: timeout,
		timeoutSeconds: timeout / 1000,
		previousTimeout: reader.getConfig().timeout,
		timestamp: new Date().toISOString(),
	};
}

async function cancelNfcOperation(reader: TangemCardReader): Promise<Record<string, unknown>> {
	const cancelResult = await reader.cancelCurrentOperation();
	
	return {
		operation: 'cancelOperation',
		cancelled: cancelResult.cancelled,
		operationType: cancelResult.operationType || 'none',
		sessionId: cancelResult.sessionId || null,
		timestamp: new Date().toISOString(),
	};
}

async function getReaderInfo(reader: TangemCardReader): Promise<Record<string, unknown>> {
	const info = await reader.getReaderInfo();
	
	return {
		operation: 'getReaderInfo',
		readerType: info.readerType || 'system',
		driverVersion: info.driverVersion || 'unknown',
		firmwareVersion: info.firmwareVersion || 'unknown',
		supportedProtocols: info.supportedProtocols || ['ISO-14443-4'],
		maxTransmitSize: info.maxTransmitSize || 256,
		features: {
			extendedLength: info.features?.extendedLength || false,
			secureCommunication: info.features?.secureCommunication || true,
			batteryLevel: info.features?.batteryLevel || null,
		},
		timestamp: new Date().toISOString(),
	};
}

export const nfcOperations = {
	initialize: initializeNfc,
	scanForCard,
	readCard,
	writeToCard,
	getStatus: getNfcStatus,
	setTimeout: setNfcTimeout,
	cancelOperation: cancelNfcOperation,
	getReaderInfo,
};
