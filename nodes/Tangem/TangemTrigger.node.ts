/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	NodeConnectionType,
} from 'n8n-workflow';

import { NfcEvent, SigningEvent, TransactionEvent, CardEvent, SecurityEvent } from './constants/events';

export class TangemTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tangem Trigger',
		name: 'tangemTrigger',
		icon: 'file:tangem.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on Tangem card events',
		defaults: {
			name: 'Tangem Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'tangemCard',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Category',
				name: 'eventCategory',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Card Events', value: 'card', description: 'Card activation, wallet changes' },
					{ name: 'NFC Events', value: 'nfc', description: 'Card tapped, read/write operations' },
					{ name: 'Security Events', value: 'security', description: 'Authentication, tampering detection' },
					{ name: 'Signing Events', value: 'signing', description: 'Signature requests and completions' },
					{ name: 'Transaction Events', value: 'transaction', description: 'Transaction lifecycle events' },
				],
				default: 'nfc',
			},

			// NFC Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						eventCategory: ['nfc'],
					},
				},
				options: [
					{ name: 'Card Tapped', value: NfcEvent.CardTapped, description: 'Triggered when a card is tapped' },
					{ name: 'Card Read Complete', value: NfcEvent.ReadComplete, description: 'Triggered when card read completes' },
					{ name: 'Card Write Complete', value: NfcEvent.WriteComplete, description: 'Triggered when card write completes' },
					{ name: 'NFC Error', value: NfcEvent.Error, description: 'Triggered on NFC error' },
					{ name: 'NFC Session Started', value: NfcEvent.SessionStarted, description: 'Triggered when NFC session starts' },
					{ name: 'NFC Session Ended', value: NfcEvent.SessionEnded, description: 'Triggered when NFC session ends' },
					{ name: 'Tag Discovered', value: NfcEvent.TagDiscovered, description: 'Triggered when NFC tag is discovered' },
					{ name: 'Tag Lost', value: NfcEvent.TagLost, description: 'Triggered when NFC tag connection lost' },
				],
				default: NfcEvent.CardTapped,
			},

			// Signing Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						eventCategory: ['signing'],
					},
				},
				options: [
					{ name: 'Sign Request', value: SigningEvent.SignRequest, description: 'Triggered when signing is requested' },
					{ name: 'Signature Complete', value: SigningEvent.SignComplete, description: 'Triggered when signing completes' },
					{ name: 'Signing Cancelled', value: SigningEvent.SignCancelled, description: 'Triggered when signing is cancelled' },
					{ name: 'Sign Failed', value: SigningEvent.SignFailed, description: 'Triggered when signing fails' },
					{ name: 'Batch Sign Started', value: SigningEvent.BatchSignStarted, description: 'Triggered when batch signing starts' },
					{ name: 'Batch Sign Complete', value: SigningEvent.BatchSignComplete, description: 'Triggered when batch signing completes' },
					{ name: 'Hash Verified', value: SigningEvent.HashVerified, description: 'Triggered when hash is verified' },
					{ name: 'Signature Verified', value: SigningEvent.SignatureVerified, description: 'Triggered when signature is verified' },
				],
				default: SigningEvent.SignComplete,
			},

			// Transaction Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						eventCategory: ['transaction'],
					},
				},
				options: [
					{ name: 'Transaction Signed', value: TransactionEvent.Signed, description: 'Triggered when transaction is signed' },
					{ name: 'Transaction Broadcast', value: TransactionEvent.Broadcast, description: 'Triggered when transaction is broadcast' },
					{ name: 'Transaction Confirmed', value: TransactionEvent.Confirmed, description: 'Triggered when transaction is confirmed' },
					{ name: 'Transaction Failed', value: TransactionEvent.Failed, description: 'Triggered when transaction fails' },
					{ name: 'Transaction Created', value: TransactionEvent.Created, description: 'Triggered when transaction is created' },
					{ name: 'Transaction Pending', value: TransactionEvent.Pending, description: 'Triggered when transaction is pending' },
					{ name: 'Transaction Rejected', value: TransactionEvent.Rejected, description: 'Triggered when transaction is rejected' },
				],
				default: TransactionEvent.Confirmed,
			},

			// Card Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						eventCategory: ['card'],
					},
				},
				options: [
					{ name: 'Card Activated', value: CardEvent.Activated, description: 'Triggered when card is activated' },
					{ name: 'Wallet Created', value: CardEvent.WalletCreated, description: 'Triggered when wallet is created' },
					{ name: 'Wallet Purged', value: CardEvent.WalletPurged, description: 'Triggered when wallet is purged' },
					{ name: 'PIN Changed', value: CardEvent.PinChanged, description: 'Triggered when PIN is changed' },
					{ name: 'Backup Created', value: CardEvent.BackupCreated, description: 'Triggered when backup is created' },
					{ name: 'Card Scanned', value: CardEvent.Scanned, description: 'Triggered when card is scanned' },
					{ name: 'Settings Changed', value: CardEvent.SettingsChanged, description: 'Triggered when settings change' },
					{ name: 'Firmware Updated', value: CardEvent.FirmwareUpdated, description: 'Triggered when firmware updates' },
					{ name: 'Attestation Verified', value: CardEvent.AttestationVerified, description: 'Triggered when attestation is verified' },
					{ name: 'Card Reset', value: CardEvent.Reset, description: 'Triggered when card is reset' },
				],
				default: CardEvent.Scanned,
			},

			// Security Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						eventCategory: ['security'],
					},
				},
				options: [
					{ name: 'Authentication Required', value: SecurityEvent.AuthRequired, description: 'Triggered when auth is required' },
					{ name: 'Access Code Required', value: SecurityEvent.AccessCodeRequired, description: 'Triggered when access code is needed' },
					{ name: 'Security Delay Active', value: SecurityEvent.SecurityDelayActive, description: 'Triggered when security delay starts' },
					{ name: 'Tampering Detected', value: SecurityEvent.TamperingDetected, description: 'Triggered when tampering detected' },
					{ name: 'Access Granted', value: SecurityEvent.AccessGranted, description: 'Triggered when access is granted' },
					{ name: 'Access Denied', value: SecurityEvent.AccessDenied, description: 'Triggered when access is denied' },
					{ name: 'Passcode Required', value: SecurityEvent.PasscodeRequired, description: 'Triggered when passcode is needed' },
					{ name: 'Biometric Required', value: SecurityEvent.BiometricRequired, description: 'Triggered when biometric is needed' },
					{ name: 'Security Delay Complete', value: SecurityEvent.SecurityDelayComplete, description: 'Triggered when delay completes' },
					{ name: 'Card Locked', value: SecurityEvent.CardLocked, description: 'Triggered when card is locked' },
				],
				default: SecurityEvent.AuthRequired,
			},

			// Filter Options
			{
				displayName: 'Filter Options',
				name: 'filterOptions',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Card ID',
						name: 'cardId',
						type: 'string',
						default: '',
						description: 'Filter by specific card ID (CID)',
					},
					{
						displayName: 'Wallet Index',
						name: 'walletIndex',
						type: 'number',
						default: -1,
						description: 'Filter by wallet index (-1 for all)',
					},
					{
						displayName: 'Chain',
						name: 'chain',
						type: 'string',
						default: '',
						description: 'Filter by blockchain (empty for all)',
					},
					{
						displayName: 'Minimum Amount',
						name: 'minAmount',
						type: 'string',
						default: '',
						description: 'Minimum transaction amount',
					},
					{
						displayName: 'Include Testnets',
						name: 'includeTestnets',
						type: 'boolean',
						default: false,
						description: 'Whether to include testnet events',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const eventCategory = this.getNodeParameter('eventCategory') as string;
		const event = this.getNodeParameter('event') as string;
		const filterOptions = this.getNodeParameter('filterOptions', {}) as {
			cardId?: string;
			walletIndex?: number;
			chain?: string;
			minAmount?: string;
			includeTestnets?: boolean;
		};

		// In a real implementation, this would set up webhooks or polling
		// For Tangem cards, this typically requires integration with a mobile app
		// or a server-side component that receives events from the Tangem SDK

		const manualTriggerFunction = async () => {
			// This provides the data structure for manual testing
			const eventData = {
				eventCategory,
				event,
				timestamp: new Date().toISOString(),
				filters: filterOptions,
				data: this.getEmitData(eventCategory, event),
			};

			this.emit([this.helpers.returnJsonArray([eventData])]);
		};

		// For production, implement event listener/polling
		const startPolling = async () => {
			// Placeholder for actual event subscription
			// In real implementation:
			// 1. Connect to Tangem SDK event stream
			// 2. Subscribe to specific events
			// 3. Filter based on filterOptions
			// 4. Emit when matching events occur

			const pollInterval = setInterval(async () => {
				// Polling logic would go here
				// For now, this is a placeholder
			}, 10000);

			return pollInterval;
		};

		return {
			manualTriggerFunction,
			closeFunction: async () => {
				// Cleanup: unsubscribe from events, close connections
			},
		};
	}

	private getEmitData(eventCategory: string, event: string): Record<string, unknown> {
		// Return sample data structure based on event type
		const baseData = {
			eventId: `evt_${Date.now()}`,
			occurredAt: new Date().toISOString(),
		};

		switch (eventCategory) {
			case 'nfc':
				return {
					...baseData,
					nfcData: {
						cardId: 'CB12345678901234',
						sessionId: `sess_${Date.now()}`,
						readerInfo: {
							type: 'NFC',
							available: true,
						},
					},
				};

			case 'signing':
				return {
					...baseData,
					signingData: {
						walletIndex: 0,
						hashCount: 1,
						curve: 'secp256k1',
						signature: null, // Will be populated on completion
					},
				};

			case 'transaction':
				return {
					...baseData,
					transactionData: {
						chain: 'ethereum',
						txHash: null,
						status: 'pending',
						amount: '0',
						fee: '0',
					},
				};

			case 'card':
				return {
					...baseData,
					cardData: {
						cardId: 'CB12345678901234',
						firmwareVersion: '6.33',
						walletCount: 1,
						isActivated: true,
					},
				};

			case 'security':
				return {
					...baseData,
					securityData: {
						securityLevel: 'standard',
						accessCodeSet: true,
						passcodeSet: false,
						delayRemaining: 0,
					},
				};

			default:
				return baseData;
		}
	}
}
