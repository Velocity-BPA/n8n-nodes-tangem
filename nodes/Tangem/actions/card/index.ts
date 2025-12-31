/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import { parseCardInfo, calculateCardHealth, getCardDisplayName } from '../../utils/cardUtils';
import { CardStatus, getCardGeneration, getProductByBatchId } from '../../constants/cardVersions';

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
		case 'scan': {
			const scanResult = await cardReader.scanCard();
			if (scanResult.success && scanResult.data) {
				const cardInfo = parseCardInfo(scanResult.data);
				result = {
					success: true,
					cardId: cardInfo.cardId,
					cardType: cardInfo.cardType,
					firmwareVersion: cardInfo.firmwareVersion,
					walletCount: cardInfo.totalWallets,
					status: cardInfo.status,
					manufacturer: cardInfo.manufacturer,
					batchId: cardInfo.batchId,
					isActivated: cardInfo.isActivated,
					supportsHD: cardInfo.supportsHdWallet,
					supportsBackup: cardInfo.supportsBackup,
					attestation: cardInfo.attestation,
				};
			} else {
				result = {
					success: false,
					error: scanResult.error || 'Failed to scan card',
				};
			}
			break;
		}

		case 'getCardInfo': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				const generation = getCardGeneration(cardInfo.firmwareVersion);
				const product = getProductByBatchId(cardInfo.batchId);

				result = {
					success: true,
					card: {
						cardId: cardInfo.cardId,
						displayName: getCardDisplayName(cardInfo),
						type: cardInfo.cardType,
						status: cardInfo.status,
						firmwareVersion: cardInfo.firmwareVersion,
						generation: generation?.name || 'Unknown',
						batchId: cardInfo.batchId,
						product: product || 'Unknown',
						manufacturer: cardInfo.manufacturer,
					},
					wallets: {
						total: cardInfo.totalWallets,
						max: cardInfo.maxWallets,
						available: cardInfo.maxWallets - cardInfo.totalWallets,
					},
					capabilities: {
						supportedCurves: cardInfo.supportedCurves,
						supportsHdWallet: cardInfo.supportsHdWallet,
						supportsBackup: cardInfo.supportsBackup,
						supportsAccessCode: cardInfo.accessCodeSet !== undefined,
						supportsPasscode: cardInfo.passcodeSet !== undefined,
					},
					security: {
						accessCodeSet: cardInfo.accessCodeSet,
						passcodeSet: cardInfo.passcodeSet,
						attestation: cardInfo.attestation,
					},
					isActivated: cardInfo.isActivated,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getCardId': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				result = {
					success: true,
					cardId: cardInfo.cardId,
					formattedCardId: formatCardId(cardInfo.cardId),
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getFirmwareVersion': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				const generation = getCardGeneration(cardInfo.firmwareVersion);
				result = {
					success: true,
					firmwareVersion: cardInfo.firmwareVersion,
					generation: generation?.version || 'Unknown',
					generationName: generation?.name || 'Unknown',
					features: generation?.features || [],
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getBatchId': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				const product = getProductByBatchId(cardInfo.batchId);
				result = {
					success: true,
					batchId: cardInfo.batchId,
					product: product || 'Unknown',
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getManufacturer': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				result = {
					success: true,
					manufacturer: cardInfo.manufacturer,
					batchId: cardInfo.batchId,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getStatus': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				result = {
					success: true,
					status: cardInfo.status,
					statusDescription: getStatusDescription(cardInfo.status),
					isActivated: cardInfo.isActivated,
					walletCount: cardInfo.totalWallets,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getSettingsMask': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				result = {
					success: true,
					settings: {
						isReusable: cardData.data.isReusable || false,
						useActivation: cardData.data.useActivation || false,
						prohibitPurgeWallet: cardData.data.prohibitPurgeWallet || false,
						useBlock: cardData.data.useBlock || false,
						allowSetPIN1: cardData.data.allowSetPIN1 || true,
						allowSetPIN2: cardData.data.allowSetPIN2 || true,
						useCvc: cardData.data.useCvc || false,
						prohibitDefaultPIN1: cardData.data.prohibitDefaultPIN1 || false,
						useOneCommandAtTime: cardData.data.useOneCommandAtTime || false,
						useNDEF: cardData.data.useNDEF || true,
						useDynamicNDEF: cardData.data.useDynamicNDEF || false,
						smartSecurityDelay: cardData.data.smartSecurityDelay || false,
						allowUnencrypted: cardData.data.allowUnencrypted || false,
						allowFastEncryption: cardData.data.allowFastEncryption || true,
						protectIssuerDataAgainstReplay: cardData.data.protectIssuerDataAgainstReplay || false,
						restrictOverwriteIssuerExtraData: cardData.data.restrictOverwriteIssuerExtraData || false,
						allowSelectBlockchain: cardData.data.allowSelectBlockchain || true,
						disablePrecomputedNDEF: cardData.data.disablePrecomputedNDEF || false,
						skipSecurityDelayIfValidatedByIssuer: cardData.data.skipSecurityDelayIfValidatedByIssuer || false,
						skipCheckPIN2CVCIfValidatedByIssuer: cardData.data.skipCheckPIN2CVCIfValidatedByIssuer || false,
						skipSecurityDelayIfValidatedByLinkedTerminal: cardData.data.skipSecurityDelayIfValidatedByLinkedTerminal || false,
						disableIssuerData: cardData.data.disableIssuerData || false,
						disableUserData: cardData.data.disableUserData || false,
					},
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getRemainingSignatures': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				result = {
					success: true,
					remainingSignatures: cardInfo.remainingSignatures,
					hasLimit: cardInfo.remainingSignatures !== undefined && cardInfo.remainingSignatures !== null,
					isUnlimited: cardInfo.remainingSignatures === null,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getHealthStatus': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				const healthScore = calculateCardHealth(cardInfo);
				result = {
					success: true,
					health: {
						score: healthScore,
						status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'fair' : 'poor',
					},
					remainingSignatures: cardInfo.remainingSignatures,
					walletsUsed: cardInfo.totalWallets,
					walletsAvailable: cardInfo.maxWallets - cardInfo.totalWallets,
					isBackedUp: cardInfo.backupStatus?.isBackedUp || false,
					firmwareVersion: cardInfo.firmwareVersion,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'checkAuthenticity': {
			const attestationResult = await cardReader.verifyAttestation();
			result = {
				success: attestationResult.success,
				isAuthentic: attestationResult.data?.isValid || false,
				attestationStatus: attestationResult.data?.status || 'unknown',
				cardIntegrity: attestationResult.data?.cardIntegrity || false,
				firmwareIntegrity: attestationResult.data?.firmwareIntegrity || false,
			};
			break;
		}

		case 'getAttestation': {
			const attestationResult = await cardReader.getAttestation();
			if (attestationResult.success && attestationResult.data) {
				result = {
					success: true,
					attestation: {
						isValid: attestationResult.data.isValid,
						cardKeyAttestation: attestationResult.data.cardKeyAttestation,
						walletKeysAttestation: attestationResult.data.walletKeysAttestation,
						firmwareAttestation: attestationResult.data.firmwareAttestation,
						cardUniquenessAttestation: attestationResult.data.cardUniquenessAttestation,
					},
				};
			} else {
				result = { success: false, error: attestationResult.error || 'Failed to get attestation' };
			}
			break;
		}

		case 'getProductMask': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				const product = getProductByBatchId(cardInfo.batchId);
				result = {
					success: true,
					productMask: cardData.data.productMask,
					product: product || 'Unknown',
					cardType: cardInfo.cardType,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'isActivated': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				result = {
					success: true,
					isActivated: cardInfo.isActivated,
					status: cardInfo.status,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getPinStatus': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const cardInfo = parseCardInfo(cardData.data);
				result = {
					success: true,
					accessCodeSet: cardInfo.accessCodeSet || false,
					passcodeSet: cardInfo.passcodeSet || false,
					accessCodeAttempts: cardData.data.accessCodeAttempts,
					passcodeAttempts: cardData.data.passcodeAttempts,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

function formatCardId(cardId: string): string {
	// Format as: XXXX-XXXX-XXXX-XXXX
	const clean = cardId.replace(/[^A-Za-z0-9]/g, '');
	return clean.match(/.{1,4}/g)?.join('-') || cardId;
}

function getStatusDescription(status: CardStatus): string {
	switch (status) {
		case CardStatus.NotPersonalized:
			return 'Card has not been personalized';
		case CardStatus.Empty:
			return 'Card is empty, no wallets created';
		case CardStatus.Loaded:
			return 'Card has wallets loaded';
		case CardStatus.Purged:
			return 'Card wallets have been purged';
		default:
			return 'Unknown status';
	}
}
