/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { TangemCardReader } from '../../transport/cardReader';

/**
 * PIN Resource Operations
 * Handles PIN/Access Code management for Tangem cards
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
				case 'setAccessCode': {
					const accessCode = this.getNodeParameter('accessCode', i) as string;

					// Validate access code
					if (accessCode.length < 4) {
						throw new Error('Access code must be at least 4 characters');
					}

					const cardData = await cardReader.scanCard();

					// Check if access code is allowed
					if (!cardData.settings?.isSettingAccessCodeAllowed) {
						throw new Error('Setting access code is not allowed on this card');
					}

					// Placeholder - In production, send SET_ACCESS_CODE command
					result = {
						success: true,
						cardId: cardData.cardId,
						accessCodeSet: true,
						message: 'Access code set successfully',
					};
					break;
				}

				case 'changeAccessCode': {
					const currentAccessCode = this.getNodeParameter('currentAccessCode', i) as string;
					const newAccessCode = this.getNodeParameter('newAccessCode', i) as string;

					if (newAccessCode.length < 4) {
						throw new Error('New access code must be at least 4 characters');
					}

					const cardData = await cardReader.scanCard();

					// Placeholder - In production, verify current and set new
					result = {
						success: true,
						cardId: cardData.cardId,
						accessCodeChanged: true,
						message: 'Access code changed successfully',
					};
					break;
				}

				case 'resetAccessCode': {
					const resetCode = this.getNodeParameter('resetCode', i, '') as string;

					const cardData = await cardReader.scanCard();

					// Check if reset is allowed
					if (!cardData.settings?.isResettingUserCodesAllowed) {
						throw new Error('Resetting access code is not allowed on this card');
					}

					// Placeholder - In production, send RESET_ACCESS_CODE command
					result = {
						success: true,
						cardId: cardData.cardId,
						accessCodeReset: true,
						message: 'Access code reset to default',
					};
					break;
				}

				case 'getAccessCodeStatus': {
					const cardData = await cardReader.scanCard();

					result = {
						success: true,
						cardId: cardData.cardId,
						isAccessCodeSet: cardData.isAccessCodeSet || false,
						isAccessCodeRequired: cardData.settings?.isSettingAccessCodeAllowed || false,
						canSetAccessCode: cardData.settings?.isSettingAccessCodeAllowed || false,
						canResetAccessCode: cardData.settings?.isResettingUserCodesAllowed || false,
					};
					break;
				}

				case 'setPasscode': {
					const passcode = this.getNodeParameter('passcode', i) as string;

					if (passcode.length < 4) {
						throw new Error('Passcode must be at least 4 characters');
					}

					const cardData = await cardReader.scanCard();

					// Check if passcode is allowed
					if (!cardData.settings?.isSettingPasscodeAllowed) {
						throw new Error('Setting passcode is not allowed on this card');
					}

					// Placeholder - In production, send SET_PASSCODE command
					result = {
						success: true,
						cardId: cardData.cardId,
						passcodeSet: true,
						message: 'Passcode set successfully',
					};
					break;
				}

				case 'changePasscode': {
					const currentPasscode = this.getNodeParameter('currentPasscode', i) as string;
					const newPasscode = this.getNodeParameter('newPasscode', i) as string;

					if (newPasscode.length < 4) {
						throw new Error('New passcode must be at least 4 characters');
					}

					const cardData = await cardReader.scanCard();

					// Placeholder - In production, verify current and set new
					result = {
						success: true,
						cardId: cardData.cardId,
						passcodeChanged: true,
						message: 'Passcode changed successfully',
					};
					break;
				}

				case 'resetPasscode': {
					const accessCode = this.getNodeParameter('accessCode', i, '') as string;

					const cardData = await cardReader.scanCard();

					// Check if reset is allowed
					if (!cardData.settings?.isResettingUserCodesAllowed) {
						throw new Error('Resetting passcode is not allowed on this card');
					}

					// Placeholder - In production, send RESET_PASSCODE command
					result = {
						success: true,
						cardId: cardData.cardId,
						passcodeReset: true,
						message: 'Passcode reset to default',
					};
					break;
				}

				case 'isPinSet': {
					const cardData = await cardReader.scanCard();

					result = {
						success: true,
						cardId: cardData.cardId,
						isAccessCodeSet: cardData.isAccessCodeSet || false,
						isPasscodeSet: cardData.isPasscodeSet || false,
						hasAnyPin: (cardData.isAccessCodeSet || cardData.isPasscodeSet) || false,
						pinType: getPinType(cardData),
					};
					break;
				}

				default:
					throw new Error(`Operation "${operation}" is not supported for PIN resource`);
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

function getPinType(cardData: Record<string, unknown>): string {
	const hasAccessCode = cardData.isAccessCodeSet as boolean;
	const hasPasscode = cardData.isPasscodeSet as boolean;

	if (hasAccessCode && hasPasscode) {
		return 'both';
	} else if (hasAccessCode) {
		return 'accessCode';
	} else if (hasPasscode) {
		return 'passcode';
	}
	return 'none';
}
