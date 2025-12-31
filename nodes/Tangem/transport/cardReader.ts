/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Card Reader for high-level Tangem card operations
 * Provides abstracted interface for card reading and writing
 */

import { NfcHandler, createNfcHandler } from './nfcHandler';
import { NfcOperationResult, NfcSessionConfig, createNfcResult } from '../utils/nfcUtils';
import {
	CardInfo,
	WalletInfo,
	parseCardInfo,
	parseWalletInfo,
	cardSupportsBlockchain,
	getRecommendedCurve,
	canCreateWallet,
	calculateCardHealth,
} from '../utils/cardUtils';
import { EllipticCurve } from '../constants/curves';
import { CardEvent, TangemErrorCode } from '../constants/events';

/**
 * Card reader options
 */
export interface CardReaderOptions extends Partial<NfcSessionConfig> {
	autoEndSession?: boolean;
	validateAttestation?: boolean;
	cacheCardInfo?: boolean;
}

/**
 * Default card reader options
 */
const DEFAULT_READER_OPTIONS: CardReaderOptions = {
	autoEndSession: true,
	validateAttestation: true,
	cacheCardInfo: true,
};

/**
 * Card scan result
 */
export interface CardScanResult {
	cardInfo: CardInfo;
	wallets: WalletInfo[];
	attestation?: {
		isValid: boolean;
		cardUnique: boolean;
		firmwareValid: boolean;
	};
	health: number;
}

/**
 * Wallet creation result
 */
export interface WalletCreationResult {
	publicKey: string;
	walletIndex: number;
	curve: EllipticCurve;
	addresses: Record<string, string>;
}

/**
 * Card Reader class
 */
export class CardReader {
	private nfcHandler: NfcHandler;
	private options: CardReaderOptions;
	private cardCache: Map<string, CardInfo> = new Map();
	private eventListeners: Map<CardEvent, Array<(data: unknown) => void>> = new Map();

	constructor(options?: CardReaderOptions) {
		this.options = { ...DEFAULT_READER_OPTIONS, ...options };
		this.nfcHandler = createNfcHandler(options);
	}

	/**
	 * Scan and read card
	 */
	async scanCard(): Promise<NfcOperationResult<CardScanResult>> {
		const startTime = Date.now();

		try {
			// Start session
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to the device');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			// Scan for card
			const scanResult = await this.nfcHandler.scanCard();
			if (!scanResult.success || !scanResult.data) {
				return createNfcResult(false, undefined, scanResult.error || 'Card not found', startTime);
			}

			// Read card data
			const readResult = await this.nfcHandler.readCard();
			if (!readResult.success || !readResult.data) {
				return createNfcResult(false, undefined, readResult.error || 'Failed to read card', startTime);
			}

			// Parse card info
			const cardInfo = parseCardInfo(readResult.data);

			// Parse wallets
			const wallets = this.parseWallets(readResult.data);

			// Validate attestation if enabled
			let attestation;
			if (this.options.validateAttestation) {
				attestation = await this.validateAttestation(cardInfo);
			}

			// Calculate health score
			const health = calculateCardHealth(cardInfo);

			// Cache card info if enabled
			if (this.options.cacheCardInfo) {
				this.cardCache.set(cardInfo.cardId, cardInfo);
			}

			// End session if auto-end enabled
			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			this.emit(CardEvent.CardScanned, { cardInfo, wallets });

			return createNfcResult(
				true,
				{
					cardInfo,
					wallets,
					attestation,
					health,
				},
				undefined,
				startTime,
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Card scan failed: ${message}`, startTime);
		}
	}

	/**
	 * Get card info (uses cache if available)
	 */
	async getCardInfo(cardId?: string): Promise<NfcOperationResult<CardInfo>> {
		const startTime = Date.now();

		// Check cache first
		if (cardId && this.options.cacheCardInfo) {
			const cached = this.cardCache.get(cardId);
			if (cached) {
				return createNfcResult(true, cached, undefined, startTime);
			}
		}

		// Scan card to get info
		const scanResult = await this.scanCard();
		if (!scanResult.success || !scanResult.data) {
			return createNfcResult(false, undefined, scanResult.error, startTime);
		}

		return createNfcResult(true, scanResult.data.cardInfo, undefined, startTime);
	}

	/**
	 * Get wallet info
	 */
	async getWallet(publicKey: string): Promise<NfcOperationResult<WalletInfo>> {
		const startTime = Date.now();

		const scanResult = await this.scanCard();
		if (!scanResult.success || !scanResult.data) {
			return createNfcResult(false, undefined, scanResult.error, startTime);
		}

		const wallet = scanResult.data.wallets.find((w) => w.publicKey === publicKey);
		if (!wallet) {
			return createNfcResult(
				false,
				undefined,
				'Wallet not found on card',
				startTime,
				TangemErrorCode.WalletNotFound,
			);
		}

		return createNfcResult(true, wallet, undefined, startTime);
	}

	/**
	 * Create wallet on card
	 */
	async createWallet(
		curve?: EllipticCurve,
		blockchain?: string,
	): Promise<NfcOperationResult<WalletCreationResult>> {
		const startTime = Date.now();

		try {
			// Get card info first
			const cardResult = await this.getCardInfo();
			if (!cardResult.success || !cardResult.data) {
				return createNfcResult(false, undefined, cardResult.error, startTime);
			}

			const cardInfo = cardResult.data;

			// Determine curve
			let walletCurve = curve;
			if (!walletCurve && blockchain) {
				if (!cardSupportsBlockchain(cardInfo, blockchain)) {
					return createNfcResult(
						false,
						undefined,
						`Card does not support ${blockchain}`,
						startTime,
						TangemErrorCode.UnsupportedCurve,
					);
				}
				walletCurve = getRecommendedCurve(cardInfo, blockchain);
			}

			// Check if wallet can be created
			if (!canCreateWallet(cardInfo)) {
				return createNfcResult(
					false,
					undefined,
					'Cannot create wallet: card is full or does not support wallet creation',
					startTime,
					TangemErrorCode.WalletCannotBeCreated,
				);
			}

			// Start session
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to create wallet');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			// Create wallet
			const createResult = await this.nfcHandler.createWallet(walletCurve);
			if (!createResult.success || !createResult.data) {
				return createNfcResult(false, undefined, createResult.error || 'Failed to create wallet', startTime);
			}

			// End session
			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			// Clear cache to force refresh
			if (cardInfo.cardId) {
				this.cardCache.delete(cardInfo.cardId);
			}

			this.emit(CardEvent.WalletCreated, { publicKey: createResult.data.publicKey });

			return createNfcResult(
				true,
				{
					publicKey: createResult.data.publicKey,
					walletIndex: createResult.data.walletIndex,
					curve: walletCurve || EllipticCurve.Secp256k1,
					addresses: {},
				},
				undefined,
				startTime,
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Wallet creation failed: ${message}`, startTime);
		}
	}

	/**
	 * Purge wallet from card
	 */
	async purgeWallet(publicKey: string): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		try {
			// Start session
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to purge wallet');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			// Purge wallet
			const purgeResult = await this.nfcHandler.purgeWallet(publicKey);
			if (!purgeResult.success) {
				return createNfcResult(false, undefined, purgeResult.error || 'Failed to purge wallet', startTime);
			}

			// End session
			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			// Clear cache
			this.cardCache.clear();

			this.emit(CardEvent.WalletPurged, { publicKey });

			return createNfcResult(true, true, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Wallet purge failed: ${message}`, startTime);
		}
	}

	/**
	 * Sign hash with card
	 */
	async signHash(
		hash: string,
		walletPublicKey: string,
		derivationPath?: string,
	): Promise<NfcOperationResult<string>> {
		const startTime = Date.now();

		try {
			// Start session
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to sign');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			// Sign hash
			const signResult = await this.nfcHandler.signHash(hash, walletPublicKey, derivationPath);
			if (!signResult.success || !signResult.data) {
				return createNfcResult(false, undefined, signResult.error || 'Failed to sign', startTime);
			}

			// End session
			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			return createNfcResult(true, signResult.data.signature, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Signing failed: ${message}`, startTime);
		}
	}

	/**
	 * Sign multiple hashes with card
	 */
	async signHashes(
		hashes: string[],
		walletPublicKey: string,
		derivationPath?: string,
	): Promise<NfcOperationResult<string[]>> {
		const startTime = Date.now();

		try {
			// Start session
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to sign');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			// Sign hashes
			const signResult = await this.nfcHandler.signHashes(hashes, walletPublicKey, derivationPath);
			if (!signResult.success || !signResult.data) {
				return createNfcResult(false, undefined, signResult.error || 'Failed to sign', startTime);
			}

			// End session
			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			return createNfcResult(true, signResult.data.signatures, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Signing failed: ${message}`, startTime);
		}
	}

	/**
	 * Set access code
	 */
	async setAccessCode(accessCode: string): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		try {
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to set access code');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			const setResult = await this.nfcHandler.setAccessCode(accessCode);
			if (!setResult.success) {
				return createNfcResult(false, undefined, setResult.error || 'Failed to set access code', startTime);
			}

			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			this.emit(CardEvent.AccessCodeSet, {});

			return createNfcResult(true, true, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Failed to set access code: ${message}`, startTime);
		}
	}

	/**
	 * Set passcode
	 */
	async setPasscode(passcode: string): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		try {
			const sessionResult = await this.nfcHandler.startSession('Hold your Tangem card to set passcode');
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}

			const setResult = await this.nfcHandler.setPasscode(passcode);
			if (!setResult.success) {
				return createNfcResult(false, undefined, setResult.error || 'Failed to set passcode', startTime);
			}

			if (this.options.autoEndSession) {
				await this.nfcHandler.endSession();
			}

			this.emit(CardEvent.PasscodeSet, {});

			return createNfcResult(true, true, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Failed to set passcode: ${message}`, startTime);
		}
	}

	/**
	 * Parse wallets from card data
	 */
	private parseWallets(data: Record<string, unknown>): WalletInfo[] {
		const wallets: WalletInfo[] = [];

		if (data.wallets && Array.isArray(data.wallets)) {
			for (const walletData of data.wallets) {
				try {
					const wallet = parseWalletInfo(walletData as Record<string, unknown>);
					wallets.push(wallet);
				} catch {
					// Skip invalid wallet data
				}
			}
		}

		return wallets;
	}

	/**
	 * Validate card attestation
	 */
	private async validateAttestation(
		cardInfo: CardInfo,
	): Promise<{ isValid: boolean; cardUnique: boolean; firmwareValid: boolean }> {
		// In real implementation, this would verify attestation signatures
		return {
			isValid: cardInfo.attestation?.isValidSignature ?? false,
			cardUnique: cardInfo.attestation?.cardUniqueness ?? false,
			firmwareValid: cardInfo.attestation?.firmwareIntegrity ?? false,
		};
	}

	/**
	 * Get NFC handler
	 */
	getNfcHandler(): NfcHandler {
		return this.nfcHandler;
	}

	/**
	 * Clear card cache
	 */
	clearCache(): void {
		this.cardCache.clear();
	}

	/**
	 * Get cached card info
	 */
	getCachedCardInfo(cardId: string): CardInfo | undefined {
		return this.cardCache.get(cardId);
	}

	/**
	 * Add event listener
	 */
	on(event: CardEvent, callback: (data: unknown) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(callback);
	}

	/**
	 * Remove event listener
	 */
	off(event: CardEvent, callback: (data: unknown) => void): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	/**
	 * Emit event
	 */
	private emit(event: CardEvent, data: unknown): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			for (const callback of listeners) {
				try {
					callback(data);
				} catch {
					// Ignore callback errors
				}
			}
		}
	}
}

/**
 * Create card reader instance
 */
export function createCardReader(options?: CardReaderOptions): CardReader {
	return new CardReader(options);
}

export default CardReader;
