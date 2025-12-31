/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * NFC Handler for Tangem card communication
 * Handles low-level NFC operations and APDU commands
 */

import {
	NfcSessionConfig,
	DEFAULT_NFC_CONFIG,
	NfcOperationResult,
	NfcSessionState,
	NfcCommand,
	ApduCommand,
	ApduResponse,
	createNfcResult,
	validateNfcConfig,
	createSessionState,
	updateSessionState,
	withTimeout,
	withRetry,
	hexToBytes,
	bytesToHex,
	isApduSuccess,
} from '../utils/nfcUtils';
import { TangemErrorCode, NfcEvent } from '../constants/events';

/**
 * NFC Handler class for managing Tangem card communication
 */
export class NfcHandler {
	private config: NfcSessionConfig;
	private sessionState: NfcSessionState;
	private isInitialized: boolean = false;
	private eventListeners: Map<NfcEvent, Array<(data: unknown) => void>> = new Map();

	constructor(config?: Partial<NfcSessionConfig>) {
		this.config = { ...DEFAULT_NFC_CONFIG, ...config };
		this.sessionState = createSessionState();
	}

	/**
	 * Initialize NFC handler
	 */
	async initialize(): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		try {
			const validationErrors = validateNfcConfig(this.config);
			if (validationErrors.length > 0) {
				return createNfcResult(false, undefined, validationErrors.join(', '), startTime);
			}

			// In a real implementation, this would initialize the NFC reader
			// For n8n node, we rely on external NFC library or mobile app bridge
			this.isInitialized = true;
			this.emit(NfcEvent.SessionStarted, { timestamp: Date.now() });

			return createNfcResult(true, true, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `NFC initialization failed: ${message}`, startTime);
		}
	}

	/**
	 * Start NFC session for card operations
	 */
	async startSession(alertMessage?: string): Promise<NfcOperationResult<NfcSessionState>> {
		const startTime = Date.now();

		if (!this.isInitialized) {
			const initResult = await this.initialize();
			if (!initResult.success) {
				return createNfcResult(false, undefined, initResult.error, startTime);
			}
		}

		try {
			this.sessionState = createSessionState();
			this.sessionState.isActive = true;

			if (alertMessage) {
				// Would display alert to user in real implementation
			}

			this.emit(NfcEvent.SessionStarted, { sessionState: this.sessionState });
			return createNfcResult(true, this.sessionState, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Failed to start NFC session: ${message}`, startTime);
		}
	}

	/**
	 * End NFC session
	 */
	async endSession(): Promise<NfcOperationResult<boolean>> {
		const startTime = Date.now();

		try {
			if (this.sessionState.isActive) {
				this.sessionState = updateSessionState(this.sessionState, NfcEvent.SessionEnded);
				this.sessionState.isActive = false;
				this.emit(NfcEvent.SessionEnded, { sessionState: this.sessionState });
			}

			return createNfcResult(true, true, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Failed to end session: ${message}`, startTime);
		}
	}

	/**
	 * Send APDU command to card
	 */
	async sendApdu(command: ApduCommand): Promise<NfcOperationResult<ApduResponse>> {
		const startTime = Date.now();

		if (!this.sessionState.isActive) {
			return createNfcResult(
				false,
				undefined,
				'No active NFC session',
				startTime,
				TangemErrorCode.NfcSessionNotActive,
			);
		}

		try {
			const operation = async (): Promise<ApduResponse> => {
				// Build APDU data
				const apduData = this.buildApduBytes(command);

				// In real implementation, this would transmit via NFC
				// For now, we simulate the response structure
				const response: ApduResponse = {
					data: new Uint8Array(0),
					sw1: 0x90,
					sw2: 0x00,
				};

				this.sessionState = updateSessionState(this.sessionState, NfcEvent.TagDiscovered);
				return response;
			};

			// Apply timeout and retry logic
			const result = await withRetry(
				() => withTimeout(operation(), this.config.timeout),
				this.config.retryAttempts,
			);

			if (!isApduSuccess(result)) {
				return createNfcResult(
					false,
					result,
					`APDU error: SW=${result.sw1.toString(16)}${result.sw2.toString(16)}`,
					startTime,
				);
			}

			return createNfcResult(true, result, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.emit(NfcEvent.Error, { error: message });
			return createNfcResult(false, undefined, `APDU command failed: ${message}`, startTime);
		}
	}

	/**
	 * Execute a Tangem command
	 */
	async executeCommand<T>(
		command: NfcCommand,
		params?: Record<string, unknown>,
	): Promise<NfcOperationResult<T>> {
		const startTime = Date.now();

		if (!this.sessionState.isActive) {
			const sessionResult = await this.startSession();
			if (!sessionResult.success) {
				return createNfcResult(false, undefined, sessionResult.error, startTime);
			}
		}

		try {
			const apduCommand = this.buildCommandApdu(command, params);
			const response = await this.sendApdu(apduCommand);

			if (!response.success || !response.data) {
				return createNfcResult(false, undefined, response.error, startTime);
			}

			const parsedData = this.parseCommandResponse<T>(command, response.data);
			return createNfcResult(true, parsedData, undefined, startTime);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return createNfcResult(false, undefined, `Command execution failed: ${message}`, startTime);
		}
	}

	/**
	 * Scan for Tangem card
	 */
	async scanCard(): Promise<NfcOperationResult<{ cardId: string; isConnected: boolean }>> {
		return this.executeCommand<{ cardId: string; isConnected: boolean }>(NfcCommand.ScanCard);
	}

	/**
	 * Read card data
	 */
	async readCard(): Promise<NfcOperationResult<Record<string, unknown>>> {
		return this.executeCommand<Record<string, unknown>>(NfcCommand.ReadCard);
	}

	/**
	 * Sign hash on card
	 */
	async signHash(
		hash: string,
		walletPublicKey: string,
		derivationPath?: string,
	): Promise<NfcOperationResult<{ signature: string }>> {
		return this.executeCommand<{ signature: string }>(NfcCommand.SignHash, {
			hash,
			walletPublicKey,
			derivationPath,
		});
	}

	/**
	 * Sign multiple hashes
	 */
	async signHashes(
		hashes: string[],
		walletPublicKey: string,
		derivationPath?: string,
	): Promise<NfcOperationResult<{ signatures: string[] }>> {
		return this.executeCommand<{ signatures: string[] }>(NfcCommand.SignHashes, {
			hashes,
			walletPublicKey,
			derivationPath,
		});
	}

	/**
	 * Create wallet on card
	 */
	async createWallet(curve?: string): Promise<NfcOperationResult<{ publicKey: string; walletIndex: number }>> {
		return this.executeCommand<{ publicKey: string; walletIndex: number }>(NfcCommand.CreateWallet, { curve });
	}

	/**
	 * Purge wallet from card
	 */
	async purgeWallet(walletPublicKey: string): Promise<NfcOperationResult<{ success: boolean }>> {
		return this.executeCommand<{ success: boolean }>(NfcCommand.PurgeWallet, { walletPublicKey });
	}

	/**
	 * Set access code on card
	 */
	async setAccessCode(accessCode: string): Promise<NfcOperationResult<{ success: boolean }>> {
		return this.executeCommand<{ success: boolean }>(NfcCommand.SetAccessCode, { accessCode });
	}

	/**
	 * Set passcode on card
	 */
	async setPasscode(passcode: string): Promise<NfcOperationResult<{ success: boolean }>> {
		return this.executeCommand<{ success: boolean }>(NfcCommand.SetPasscode, { passcode });
	}

	/**
	 * Build APDU bytes from command
	 */
	private buildApduBytes(command: ApduCommand): Uint8Array {
		const header = new Uint8Array([command.cla, command.ins, command.p1, command.p2]);

		if (!command.data || command.data.length === 0) {
			if (command.le !== undefined) {
				return new Uint8Array([...header, command.le]);
			}
			return header;
		}

		const lc = command.data.length;
		const data =
			typeof command.data === 'string' ? hexToBytes(command.data) : new Uint8Array(command.data);

		if (command.le !== undefined) {
			return new Uint8Array([...header, lc, ...data, command.le]);
		}

		return new Uint8Array([...header, lc, ...data]);
	}

	/**
	 * Build command-specific APDU
	 */
	private buildCommandApdu(command: NfcCommand, params?: Record<string, unknown>): ApduCommand {
		// CLA for Tangem commands
		const CLA_TANGEM = 0x80;

		switch (command) {
			case NfcCommand.ScanCard:
				return { cla: CLA_TANGEM, ins: 0x01, p1: 0x00, p2: 0x00, le: 0x00 };
			case NfcCommand.ReadCard:
				return { cla: CLA_TANGEM, ins: 0x02, p1: 0x00, p2: 0x00, le: 0x00 };
			case NfcCommand.SignHash:
				return {
					cla: CLA_TANGEM,
					ins: 0x10,
					p1: 0x00,
					p2: 0x00,
					data: this.encodeSignParams(params),
					le: 0x00,
				};
			case NfcCommand.SignHashes:
				return {
					cla: CLA_TANGEM,
					ins: 0x11,
					p1: 0x00,
					p2: 0x00,
					data: this.encodeSignParams(params),
					le: 0x00,
				};
			case NfcCommand.CreateWallet:
				return {
					cla: CLA_TANGEM,
					ins: 0x20,
					p1: 0x00,
					p2: 0x00,
					data: this.encodeCreateWalletParams(params),
					le: 0x00,
				};
			case NfcCommand.PurgeWallet:
				return {
					cla: CLA_TANGEM,
					ins: 0x21,
					p1: 0x00,
					p2: 0x00,
					data: params?.walletPublicKey
						? hexToBytes(params.walletPublicKey as string)
						: new Uint8Array(0),
					le: 0x00,
				};
			case NfcCommand.SetAccessCode:
				return {
					cla: CLA_TANGEM,
					ins: 0x30,
					p1: 0x00,
					p2: 0x00,
					data: new TextEncoder().encode(params?.accessCode as string),
					le: 0x00,
				};
			case NfcCommand.SetPasscode:
				return {
					cla: CLA_TANGEM,
					ins: 0x31,
					p1: 0x00,
					p2: 0x00,
					data: new TextEncoder().encode(params?.passcode as string),
					le: 0x00,
				};
			default:
				return { cla: CLA_TANGEM, ins: 0x00, p1: 0x00, p2: 0x00 };
		}
	}

	/**
	 * Encode signing parameters
	 */
	private encodeSignParams(params?: Record<string, unknown>): Uint8Array {
		if (!params) return new Uint8Array(0);

		const parts: Uint8Array[] = [];

		if (params.hash) {
			parts.push(hexToBytes(params.hash as string));
		}

		if (params.hashes && Array.isArray(params.hashes)) {
			for (const hash of params.hashes) {
				parts.push(hexToBytes(hash as string));
			}
		}

		if (params.walletPublicKey) {
			parts.push(hexToBytes(params.walletPublicKey as string));
		}

		// Combine all parts
		const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
		const result = new Uint8Array(totalLength);
		let offset = 0;
		for (const part of parts) {
			result.set(part, offset);
			offset += part.length;
		}

		return result;
	}

	/**
	 * Encode create wallet parameters
	 */
	private encodeCreateWalletParams(params?: Record<string, unknown>): Uint8Array {
		if (!params?.curve) return new Uint8Array([0x00]); // Default curve

		const curveMap: Record<string, number> = {
			secp256k1: 0x00,
			secp256r1: 0x01,
			ed25519: 0x02,
			ed25519_slip0010: 0x03,
			bls12381_g2: 0x04,
			bip0340: 0x05,
		};

		const curveId = curveMap[(params.curve as string).toLowerCase()] ?? 0x00;
		return new Uint8Array([curveId]);
	}

	/**
	 * Parse command response
	 */
	private parseCommandResponse<T>(command: NfcCommand, response: ApduResponse): T {
		const data = response.data;

		switch (command) {
			case NfcCommand.ScanCard:
				return {
					cardId: bytesToHex(data.slice(0, 32)),
					isConnected: true,
				} as T;

			case NfcCommand.ReadCard:
				return this.parseCardData(data) as T;

			case NfcCommand.SignHash:
				return {
					signature: bytesToHex(data),
				} as T;

			case NfcCommand.SignHashes:
				// Parse multiple signatures (each 64 bytes for secp256k1)
				const signatures: string[] = [];
				for (let i = 0; i < data.length; i += 64) {
					signatures.push(bytesToHex(data.slice(i, i + 64)));
				}
				return { signatures } as T;

			case NfcCommand.CreateWallet:
				return {
					publicKey: bytesToHex(data.slice(0, 65)),
					walletIndex: data[65] || 0,
				} as T;

			case NfcCommand.PurgeWallet:
			case NfcCommand.SetAccessCode:
			case NfcCommand.SetPasscode:
				return { success: true } as T;

			default:
				return {} as T;
		}
	}

	/**
	 * Parse card data from response
	 */
	private parseCardData(data: Uint8Array): Record<string, unknown> {
		// This would parse TLV-encoded card data in real implementation
		return {
			raw: bytesToHex(data),
		};
	}

	/**
	 * Add event listener
	 */
	on(event: NfcEvent, callback: (data: unknown) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event)!.push(callback);
	}

	/**
	 * Remove event listener
	 */
	off(event: NfcEvent, callback: (data: unknown) => void): void {
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
	private emit(event: NfcEvent, data: unknown): void {
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
	 * Get current session state
	 */
	getSessionState(): NfcSessionState {
		return { ...this.sessionState };
	}

	/**
	 * Check if session is active
	 */
	isSessionActive(): boolean {
		return this.sessionState.isActive;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<NfcSessionConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): NfcSessionConfig {
		return { ...this.config };
	}
}

/**
 * Create NFC handler instance
 */
export function createNfcHandler(config?: Partial<NfcSessionConfig>): NfcHandler {
	return new NfcHandler(config);
}

export default NfcHandler;
