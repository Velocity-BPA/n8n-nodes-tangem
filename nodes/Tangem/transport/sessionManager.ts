/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Session Manager for Tangem card operations
 * Manages NFC sessions across multiple operations and cards
 */

import { NfcHandler, createNfcHandler } from './nfcHandler';
import { CardReader, createCardReader, CardReaderOptions } from './cardReader';
import { NfcSessionConfig, NfcOperationResult, createNfcResult } from '../utils/nfcUtils';
import { CardInfo } from '../utils/cardUtils';
import {
	BackupProcessState,
	BackupProcessResult,
	CardSetInfo,
	createBackupResult,
	validateBackupSet,
	createCardSetInfo,
	getNextBackupInstruction,
	BackupInstructions,
} from '../utils/backupUtils';
import { NfcEvent, CardEvent, BackupEvent, TangemErrorCode } from '../constants/events';

/**
 * Session state
 */
export interface SessionState {
	isActive: boolean;
	currentCardId?: string;
	operationType?: string;
	startTime: number;
	lastActivity: number;
	operationCount: number;
}

/**
 * Session manager options
 */
export interface SessionManagerOptions extends CardReaderOptions {
	sessionTimeout?: number;
	maxOperations?: number;
	enableBackup?: boolean;
}

/**
 * Default session manager options
 */
const DEFAULT_SESSION_OPTIONS: SessionManagerOptions = {
	sessionTimeout: 120000, // 2 minutes
	maxOperations: 100,
	enableBackup: true,
};

/**
 * Backup session state
 */
interface BackupSessionState {
	state: BackupProcessState;
	primaryCard?: CardInfo;
	backupCards: CardInfo[];
	currentBackupIndex: number;
	error?: string;
}

/**
 * Session Manager class
 */
export class SessionManager {
	private options: SessionManagerOptions;
	private cardReader: CardReader;
	private sessionState: SessionState;
	private backupState: BackupSessionState;
	private timeoutHandle?: ReturnType<typeof setTimeout>;
	private eventListeners: Map<string, Array<(data: unknown) => void>> = new Map();

	constructor(options?: SessionManagerOptions) {
		this.options = { ...DEFAULT_SESSION_OPTIONS, ...options };
		this.cardReader = createCardReader(options);
		this.sessionState = this.createInitialSessionState();
		this.backupState = this.createInitialBackupState();
	}

	/**
	 * Start a new session
	 */
	async startSession(operationType?: string): Promise<NfcOperationResult<SessionState>> {
		const startTime = Date.now();

		try {
			// End any existing session
			if (this.sessionState.isActive) {
				await this.endSession();
			}

			// Initialize session state
			this.sessionState = {
				isActive: true,
				operationType,
				startTime: Date.now(),
				lastActivity: Date.now(),
				operationCount: 0,
			};

			// Set session timeout
			this.setSessionTimeout();

			this.emit('sessionStarted', { sessionState: this.sessionState });

			return createNfcResult(true, this.sessionState, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Failed to start session: ${message}`, startTime);
		}
	}

	/**
	 * End current session
	 */
	async endSession(): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		try {
			if (this.timeoutHandle) {
				clearTimeout(this.timeoutHandle);
				this.timeoutHandle = undefined;
			}

			// End NFC session
			await this.cardReader.getNfcHandler().endSession();

			// Clear backup state if needed
			if (this.backupState.state !== BackupProcessState.Complete) {
				this.backupState = this.createInitialBackupState();
			}

			const previousState = { ...this.sessionState };
			this.sessionState = this.createInitialSessionState();

			this.emit('sessionEnded', { previousState });

			return createNfcResult(true, true, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Failed to end session: ${message}`, startTime);
		}
	}

	/**
	 * Scan card within session
	 */
	async scanCard(): Promise<NfcOperationResult<CardInfo>> {
		this.updateActivity();

		if (!this.checkSession()) {
			return createNfcResult(
				false,
				undefined,
				'No active session',
				Date.now(),
				TangemErrorCode.NfcSessionNotActive,
			);
		}

		const result = await this.cardReader.scanCard();
		if (result.success && result.data) {
			this.sessionState.currentCardId = result.data.cardInfo.cardId;
			return createNfcResult(true, result.data.cardInfo, undefined, Date.now());
		}

		return createNfcResult(false, undefined, result.error, Date.now());
	}

	/**
	 * Sign hash within session
	 */
	async signHash(
		hash: string,
		walletPublicKey: string,
		derivationPath?: string,
	): Promise<NfcOperationResult<string>> {
		this.updateActivity();

		if (!this.checkSession()) {
			return createNfcResult(
				false,
				undefined,
				'No active session',
				Date.now(),
				TangemErrorCode.NfcSessionNotActive,
			);
		}

		return this.cardReader.signHash(hash, walletPublicKey, derivationPath);
	}

	/**
	 * Sign multiple hashes within session
	 */
	async signHashes(
		hashes: string[],
		walletPublicKey: string,
		derivationPath?: string,
	): Promise<NfcOperationResult<string[]>> {
		this.updateActivity();

		if (!this.checkSession()) {
			return createNfcResult(
				false,
				undefined,
				'No active session',
				Date.now(),
				TangemErrorCode.NfcSessionNotActive,
			);
		}

		return this.cardReader.signHashes(hashes, walletPublicKey, derivationPath);
	}

	/**
	 * Create wallet within session
	 */
	async createWallet(curve?: string, blockchain?: string): Promise<NfcOperationResult<{ publicKey: string }>> {
		this.updateActivity();

		if (!this.checkSession()) {
			return createNfcResult(
				false,
				undefined,
				'No active session',
				Date.now(),
				TangemErrorCode.NfcSessionNotActive,
			);
		}

		const result = await this.cardReader.createWallet(curve as any, blockchain);
		if (result.success && result.data) {
			return createNfcResult(true, { publicKey: result.data.publicKey }, undefined, Date.now());
		}

		return createNfcResult(false, undefined, result.error, Date.now());
	}

	/**
	 * Start backup process
	 */
	async startBackup(): Promise<NfcOperationResult<BackupInstructions>> {
		const startTime = Date.now();

		if (!this.options.enableBackup) {
			return createNfcResult(false, undefined, 'Backup not enabled', startTime);
		}

		// Start session for backup
		const sessionResult = await this.startSession('backup');
		if (!sessionResult.success) {
			return createNfcResult(false, undefined, sessionResult.error, startTime);
		}

		// Reset backup state
		this.backupState = this.createInitialBackupState();
		this.backupState.state = BackupProcessState.NotStarted;

		this.emit(BackupEvent.Started, { backupState: this.backupState });

		const instructions = getNextBackupInstruction(this.backupState.state, 1, 0);
		return createNfcResult(true, instructions!, undefined, startTime);
	}

	/**
	 * Read primary card for backup
	 */
	async readPrimaryCard(): Promise<NfcOperationResult<CardInfo>> {
		const startTime = Date.now();

		if (this.backupState.state !== BackupProcessState.NotStarted) {
			return createNfcResult(false, undefined, 'Invalid backup state for reading primary card', startTime);
		}

		this.backupState.state = BackupProcessState.ReadingPrimary;

		const scanResult = await this.scanCard();
		if (!scanResult.success || !scanResult.data) {
			this.backupState.state = BackupProcessState.Failed;
			this.backupState.error = scanResult.error;
			return createNfcResult(false, undefined, scanResult.error, startTime);
		}

		this.backupState.primaryCard = scanResult.data;
		this.backupState.state = BackupProcessState.LinkingBackup;

		this.emit(BackupEvent.PrimaryCardRead, { cardInfo: scanResult.data });

		return createNfcResult(true, scanResult.data, undefined, startTime);
	}

	/**
	 * Link backup card
	 */
	async linkBackupCard(): Promise<NfcOperationResult<CardInfo>> {
		const startTime = Date.now();

		if (this.backupState.state !== BackupProcessState.LinkingBackup) {
			return createNfcResult(false, undefined, 'Invalid backup state for linking backup card', startTime);
		}

		const scanResult = await this.scanCard();
		if (!scanResult.success || !scanResult.data) {
			return createNfcResult(false, undefined, scanResult.error, startTime);
		}

		// Validate backup card
		if (this.backupState.primaryCard) {
			const validation = validateBackupSet(this.backupState.primaryCard, [
				...this.backupState.backupCards,
				scanResult.data,
			]);

			if (!validation.valid) {
				return createNfcResult(false, undefined, validation.error, startTime);
			}
		}

		this.backupState.backupCards.push(scanResult.data);
		this.backupState.currentBackupIndex++;

		this.emit(BackupEvent.BackupCardLinked, {
			cardInfo: scanResult.data,
			index: this.backupState.currentBackupIndex,
		});

		return createNfcResult(true, scanResult.data, undefined, startTime);
	}

	/**
	 * Start writing backup data
	 */
	async startWritingBackup(): Promise<NfcOperationResult<BackupInstructions>> {
		const startTime = Date.now();

		if (
			this.backupState.state !== BackupProcessState.LinkingBackup ||
			this.backupState.backupCards.length === 0
		) {
			return createNfcResult(false, undefined, 'No backup cards linked', startTime);
		}

		this.backupState.state = BackupProcessState.WritingBackup;
		this.backupState.currentBackupIndex = 0;

		const instructions = getNextBackupInstruction(
			this.backupState.state,
			this.backupState.backupCards.length,
			0,
		);

		return createNfcResult(true, instructions!, undefined, startTime);
	}

	/**
	 * Write to backup card
	 */
	async writeBackupCard(): Promise<NfcOperationResult<{ index: number; remaining: number }>> {
		const startTime = Date.now();

		if (this.backupState.state !== BackupProcessState.WritingBackup) {
			return createNfcResult(false, undefined, 'Invalid backup state for writing', startTime);
		}

		// Simulate writing backup data (in real implementation, this would write wallet data)
		const index = this.backupState.currentBackupIndex;

		this.emit(BackupEvent.BackupCardWritten, {
			index,
			cardId: this.backupState.backupCards[index]?.cardId,
		});

		this.backupState.currentBackupIndex++;

		const remaining = this.backupState.backupCards.length - this.backupState.currentBackupIndex;

		if (remaining === 0) {
			this.backupState.state = BackupProcessState.Verifying;
		}

		return createNfcResult(true, { index, remaining }, undefined, startTime);
	}

	/**
	 * Verify backup
	 */
	async verifyBackup(): Promise<NfcOperationResult<BackupProcessResult>> {
		const startTime = Date.now();

		if (this.backupState.state !== BackupProcessState.Verifying) {
			return createNfcResult(false, undefined, 'Invalid backup state for verification', startTime);
		}

		// Verify backup integrity
		if (!this.backupState.primaryCard) {
			this.backupState.state = BackupProcessState.Failed;
			return createNfcResult(false, undefined, 'No primary card data', startTime);
		}

		this.backupState.state = BackupProcessState.Complete;

		const result = createBackupResult(
			true,
			BackupProcessState.Complete,
			this.backupState.primaryCard.cardId,
			this.backupState.backupCards.map((c) => c.cardId),
		);

		this.emit(BackupEvent.Completed, { result });

		return createNfcResult(true, result, undefined, startTime);
	}

	/**
	 * Cancel backup process
	 */
	async cancelBackup(): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		this.backupState = this.createInitialBackupState();
		this.backupState.state = BackupProcessState.Failed;

		this.emit(BackupEvent.Failed, { reason: 'Cancelled by user' });

		return createNfcResult(true, true, undefined, startTime);
	}

	/**
	 * Get backup state
	 */
	getBackupState(): BackupSessionState {
		return { ...this.backupState };
	}

	/**
	 * Get card set info
	 */
	getCardSetInfo(): CardSetInfo | null {
		if (!this.backupState.primaryCard) {
			return null;
		}

		return createCardSetInfo(this.backupState.primaryCard, this.backupState.backupCards);
	}

	/**
	 * Get session state
	 */
	getSessionState(): SessionState {
		return { ...this.sessionState };
	}

	/**
	 * Check if session is active
	 */
	isSessionActive(): boolean {
		return this.sessionState.isActive;
	}

	/**
	 * Get card reader
	 */
	getCardReader(): CardReader {
		return this.cardReader;
	}

	/**
	 * Add event listener
	 */
	on(event: string, callback: (data: unknown) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(callback);
	}

	/**
	 * Remove event listener
	 */
	off(event: string, callback: (data: unknown) => void): void {
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
	private emit(event: string, data: unknown): void {
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

	/**
	 * Create initial session state
	 */
	private createInitialSessionState(): SessionState {
		return {
			isActive: false,
			startTime: 0,
			lastActivity: 0,
			operationCount: 0,
		};
	}

	/**
	 * Create initial backup state
	 */
	private createInitialBackupState(): BackupSessionState {
		return {
			state: BackupProcessState.NotStarted,
			backupCards: [],
			currentBackupIndex: 0,
		};
	}

	/**
	 * Check if session is valid
	 */
	private checkSession(): boolean {
		if (!this.sessionState.isActive) {
			return false;
		}

		if (this.options.maxOperations && this.sessionState.operationCount >= this.options.maxOperations) {
			return false;
		}

		return true;
	}

	/**
	 * Update activity timestamp
	 */
	private updateActivity(): void {
		this.sessionState.lastActivity = Date.now();
		this.sessionState.operationCount++;
		this.setSessionTimeout();
	}

	/**
	 * Set session timeout
	 */
	private setSessionTimeout(): void {
		if (this.timeoutHandle) {
			clearTimeout(this.timeoutHandle);
		}

		if (this.options.sessionTimeout) {
			this.timeoutHandle = setTimeout(() => {
				this.endSession();
				this.emit('sessionTimeout', { sessionState: this.sessionState });
			}, this.options.sessionTimeout);
		}
	}
}

/**
 * Create session manager instance
 */
export function createSessionManager(options?: SessionManagerOptions): SessionManager {
	return new SessionManager(options);
}

export default SessionManager;
