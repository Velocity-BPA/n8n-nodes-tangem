/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';
import {
	getBackupRequirements,
	validateBackupSet,
	getBackupProgress,
	createCardSetInfo,
	parseBackupStatus,
} from '../../utils/backupUtils';

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
		case 'getSetInfo': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const backupStatus = parseBackupStatus(cardData.data);
				const setInfo = createCardSetInfo(
					cardData.data.cardId,
					backupStatus.backupCardIds || [],
					backupStatus.isBackedUp,
				);

				result = {
					success: true,
					cardSet: {
						setId: setInfo.setId,
						primaryCardId: setInfo.primaryCardId,
						backupCardIds: setInfo.backupCardIds,
						totalCards: setInfo.totalCards,
						isComplete: setInfo.isComplete,
					},
					backupStatus: {
						isBackedUp: backupStatus.isBackedUp,
						cardCount: backupStatus.cardCount,
						status: backupStatus.status,
					},
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getPrimaryCard': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const isPrimary = !cardData.data.isBackupCard;
				result = {
					success: true,
					isPrimary,
					cardId: cardData.data.cardId,
					firmwareVersion: cardData.data.firmwareVersion,
					walletCount: cardData.data.wallets?.length || 0,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'getBackupCards': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const backupStatus = parseBackupStatus(cardData.data);
				result = {
					success: true,
					backupCards: backupStatus.backupCardIds || [],
					backupCount: backupStatus.cardCount - 1, // Exclude primary
					linkedAt: backupStatus.linkedAt,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'linkBackup': {
			// Start backup linking process
			const linkResult = await cardReader.startBackupProcess();
			if (linkResult.success) {
				result = {
					success: true,
					message: 'Backup card linking initiated. Tap the backup card to continue.',
					processState: linkResult.data?.state,
					instructions: 'Please tap the backup card on your NFC reader',
				};
			} else {
				result = { success: false, error: linkResult.error || 'Failed to start backup linking' };
			}
			break;
		}

		case 'getBackupStatus': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const backupStatus = parseBackupStatus(cardData.data);
				const progress = getBackupProgress(backupStatus.status);

				result = {
					success: true,
					status: backupStatus.status,
					progress,
					isBackedUp: backupStatus.isBackedUp,
					cardCount: backupStatus.cardCount,
					primaryCardId: backupStatus.primaryCardId,
					backupCardIds: backupStatus.backupCardIds,
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'readPrimaryCard': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				if (cardData.data.isBackupCard) {
					result = { success: false, error: 'This is a backup card, not the primary card' };
				} else {
					result = {
						success: true,
						primaryCard: {
							cardId: cardData.data.cardId,
							firmwareVersion: cardData.data.firmwareVersion,
							wallets: cardData.data.wallets?.map((w: Record<string, unknown>) => ({
								publicKey: w.publicKey,
								curve: w.curve,
								index: w.index,
							})),
							backupStatus: parseBackupStatus(cardData.data),
						},
					};
				}
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'readBackupCard': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				if (!cardData.data.isBackupCard) {
					result = { success: false, error: 'This is the primary card, not a backup card' };
				} else {
					result = {
						success: true,
						backupCard: {
							cardId: cardData.data.cardId,
							linkedToPrimary: cardData.data.primaryCardId,
							firmwareVersion: cardData.data.firmwareVersion,
							wallets: cardData.data.wallets?.map((w: Record<string, unknown>) => ({
								publicKey: w.publicKey,
								curve: w.curve,
								index: w.index,
							})),
						},
					};
				}
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'checkIntegrity': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				const backupStatus = parseBackupStatus(cardData.data);
				const validation = validateBackupSet({
					primary: cardData.data,
					backups: [], // Would need to scan backup cards
				});

				result = {
					success: true,
					integrity: {
						isValid: validation.isValid,
						errors: validation.errors,
						warnings: validation.warnings,
					},
					backupStatus: {
						isBackedUp: backupStatus.isBackedUp,
						cardCount: backupStatus.cardCount,
					},
				};
			} else {
				result = { success: false, error: cardData.error || 'Failed to read card' };
			}
			break;
		}

		case 'activateSet': {
			const activateResult = await cardReader.activateCardSet();
			result = {
				success: activateResult.success,
				message: activateResult.success ? 'Card set activated successfully' : activateResult.error,
			};
			break;
		}

		case 'getSetPinStatus': {
			const cardData = await cardReader.readCard();
			if (cardData.success && cardData.data) {
				result = {
					success: true,
					accessCodeSet: cardData.data.accessCodeSet || false,
					passcodeSet: cardData.data.passcodeSet || false,
					syncedAcrossSet: cardData.data.pinSyncedAcrossSet || false,
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
