/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	parseSignature,
	formatSignature,
	hashMessage,
	prepareEthereumMessage,
	serializeTransaction,
} from '../../nodes/Tangem/utils/signingUtils';

describe('Signing Utils', () => {
	describe('parseSignature', () => {
		it('should parse 65-byte signature into r, s, v', () => {
			const signature = '0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b';
			const parsed = parseSignature(signature);
			expect(parsed).toHaveProperty('r');
			expect(parsed).toHaveProperty('s');
			expect(parsed).toHaveProperty('v');
			expect(parsed.r).toHaveLength(66); // 0x + 64 hex chars
			expect(parsed.s).toHaveLength(66);
		});

		it('should handle signature without 0x prefix', () => {
			const signature = 'ab'.repeat(32) + 'cd'.repeat(32) + '1b';
			const parsed = parseSignature(signature);
			expect(parsed.r).toStartWith('0x');
		});
	});

	describe('formatSignature', () => {
		it('should concatenate r, s, v into single signature', () => {
			const r = '0x' + 'ab'.repeat(32);
			const s = '0x' + 'cd'.repeat(32);
			const v = 27;
			const formatted = formatSignature(r, s, v);
			expect(formatted).toHaveLength(132); // 0x + 130 hex chars
		});
	});

	describe('hashMessage', () => {
		it('should hash message using keccak256', () => {
			const message = 'Hello, World!';
			const hash = hashMessage(message);
			expect(hash).toStartWith('0x');
			expect(hash).toHaveLength(66); // 0x + 64 hex chars
		});

		it('should produce consistent hashes', () => {
			const message = 'test message';
			const hash1 = hashMessage(message);
			const hash2 = hashMessage(message);
			expect(hash1).toBe(hash2);
		});
	});

	describe('prepareEthereumMessage', () => {
		it('should prefix message with Ethereum signed message header', () => {
			const message = 'Hello';
			const prepared = prepareEthereumMessage(message);
			expect(prepared).toContain('Ethereum Signed Message');
		});

		it('should include message length', () => {
			const message = 'Hello';
			const prepared = prepareEthereumMessage(message);
			expect(prepared).toContain(message.length.toString());
		});
	});

	describe('serializeTransaction', () => {
		it('should serialize EIP-1559 transaction', () => {
			const tx = {
				type: 2,
				chainId: 1,
				nonce: 0,
				maxPriorityFeePerGas: '1000000000',
				maxFeePerGas: '2000000000',
				gasLimit: '21000',
				to: '0x' + 'ab'.repeat(20),
				value: '1000000000000000000',
				data: '0x',
			};
			const serialized = serializeTransaction(tx);
			expect(serialized).toStartWith('0x');
		});

		it('should serialize legacy transaction', () => {
			const tx = {
				type: 0,
				chainId: 1,
				nonce: 0,
				gasPrice: '2000000000',
				gasLimit: '21000',
				to: '0x' + 'ab'.repeat(20),
				value: '1000000000000000000',
				data: '0x',
			};
			const serialized = serializeTransaction(tx);
			expect(serialized).toStartWith('0x');
		});
	});
});
