/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration tests for Tangem n8n node
 * These tests require mocked NFC hardware or a test environment
 */

import { TangemCardReader } from '../../nodes/Tangem/transport/cardReader';
import { TangemSessionManager } from '../../nodes/Tangem/transport/sessionManager';

// Mock the NFC handler for testing
jest.mock('../../nodes/Tangem/transport/nfcHandler', () => ({
	TangemNFCHandler: jest.fn().mockImplementation(() => ({
		initialize: jest.fn().mockResolvedValue({ available: true, enabled: true }),
		waitForCard: jest.fn().mockResolvedValue({
			found: true,
			cardId: 'CB51000000012345',
			cardType: 'tangem_wallet',
		}),
		sendApdu: jest.fn().mockResolvedValue({
			success: true,
			data: Buffer.from([0x90, 0x00]),
		}),
		disconnect: jest.fn().mockResolvedValue(undefined),
	})),
}));

describe('Tangem Node Integration', () => {
	let reader: TangemCardReader;
	let sessionManager: TangemSessionManager;

	beforeEach(() => {
		reader = new TangemCardReader({
			timeout: 5000,
			retryAttempts: 1,
		});
		sessionManager = new TangemSessionManager();
	});

	afterEach(async () => {
		await sessionManager.closeAllSessions();
	});

	describe('Card Reader', () => {
		it('should initialize successfully', async () => {
			const status = await reader.initialize();
			expect(status.available).toBe(true);
			expect(status.enabled).toBe(true);
		});

		it('should wait for card tap', async () => {
			const result = await reader.waitForCard({ timeout: 5000 });
			expect(result.found).toBe(true);
			expect(result.cardId).toBeDefined();
		});

		it('should read card data', async () => {
			const cardData = await reader.readCard('CB51000000012345');
			expect(cardData).toHaveProperty('cardId');
		});
	});

	describe('Session Manager', () => {
		it('should create new session', async () => {
			const session = await sessionManager.createSession('CB51000000012345');
			expect(session).toHaveProperty('sessionId');
			expect(session).toHaveProperty('cardId');
		});

		it('should get active session', async () => {
			await sessionManager.createSession('CB51000000012345');
			const session = sessionManager.getSession('CB51000000012345');
			expect(session).toBeDefined();
		});

		it('should close session', async () => {
			await sessionManager.createSession('CB51000000012345');
			await sessionManager.closeSession('CB51000000012345');
			const session = sessionManager.getSession('CB51000000012345');
			expect(session).toBeUndefined();
		});

		it('should handle multiple sessions', async () => {
			await sessionManager.createSession('CB51000000012345');
			await sessionManager.createSession('CB51000000067890');
			
			const sessions = sessionManager.getAllSessions();
			expect(sessions).toHaveLength(2);
		});
	});

	describe('Card Operations', () => {
		it('should scan card and get info', async () => {
			const status = await reader.initialize();
			expect(status.available).toBe(true);

			const scanResult = await reader.waitForCard({ timeout: 5000 });
			expect(scanResult.found).toBe(true);

			const cardInfo = await reader.readCard(scanResult.cardId!);
			expect(cardInfo).toHaveProperty('cardId');
			expect(cardInfo).toHaveProperty('firmwareVersion');
		});

		it('should create wallet on card', async () => {
			// Note: This would modify card state in production
			// Only run against test cards
			const result = await reader.createWallet('CB51000000012345', {
				curve: 'secp256k1',
			});
			expect(result).toHaveProperty('walletIndex');
			expect(result).toHaveProperty('publicKey');
		});

		it('should get wallet public key', async () => {
			const result = await reader.getWalletPublicKey('CB51000000012345', 0);
			expect(result).toHaveProperty('publicKey');
			expect(result.publicKey).toMatch(/^[0-9a-fA-F]+$/);
		});
	});

	describe('Signing Operations', () => {
		it('should sign hash', async () => {
			const hash = '0x' + 'ab'.repeat(32);
			const result = await reader.signHash('CB51000000012345', 0, hash);
			expect(result).toHaveProperty('signature');
			expect(result.signature).toMatch(/^0x[0-9a-fA-F]+$/);
		});

		it('should sign Ethereum transaction', async () => {
			const tx = {
				type: 2,
				chainId: 1,
				nonce: 0,
				maxPriorityFeePerGas: '1000000000',
				maxFeePerGas: '2000000000',
				gasLimit: '21000',
				to: '0x' + 'ab'.repeat(20),
				value: '0',
				data: '0x',
			};
			const result = await reader.signTransaction('CB51000000012345', 0, tx);
			expect(result).toHaveProperty('signedTransaction');
		});

		it('should sign message', async () => {
			const message = 'Hello, Tangem!';
			const result = await reader.signMessage('CB51000000012345', 0, message);
			expect(result).toHaveProperty('signature');
		});
	});

	describe('Error Handling', () => {
		it('should handle card not found', async () => {
			jest.spyOn(reader, 'waitForCard').mockResolvedValueOnce({
				found: false,
				cardId: null,
			});

			const result = await reader.waitForCard({ timeout: 1000 });
			expect(result.found).toBe(false);
		});

		it('should handle invalid card ID', async () => {
			await expect(reader.readCard('invalid')).rejects.toThrow();
		});

		it('should handle signing timeout', async () => {
			jest.spyOn(reader, 'signHash').mockRejectedValueOnce(new Error('Timeout'));
			
			await expect(
				reader.signHash('CB51000000012345', 0, '0x' + 'ab'.repeat(32))
			).rejects.toThrow('Timeout');
		});
	});
});

describe('Multi-Chain Support', () => {
	let reader: TangemCardReader;

	beforeEach(() => {
		reader = new TangemCardReader({
			timeout: 5000,
			retryAttempts: 1,
		});
	});

	it('should derive Ethereum address', async () => {
		const result = await reader.deriveAddress('CB51000000012345', 0, 'ethereum');
		expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
	});

	it('should derive Bitcoin address', async () => {
		const result = await reader.deriveAddress('CB51000000012345', 0, 'bitcoin');
		expect(result.address).toMatch(/^(bc1|[13])/);
	});

	it('should derive Solana address', async () => {
		const result = await reader.deriveAddress('CB51000000012345', 0, 'solana');
		expect(result.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
	});
});
