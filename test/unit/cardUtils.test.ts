/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	formatCardId,
	parseSettingsMask,
	getCardStatus,
	calculateHealthScore,
	validateCardId,
} from '../../nodes/Tangem/utils/cardUtils';

describe('Card Utils', () => {
	describe('formatCardId', () => {
		it('should format card ID with colons', () => {
			const cardId = 'CB51000000012345';
			const formatted = formatCardId(cardId);
			expect(formatted).toMatch(/^[A-F0-9]{2}(:[A-F0-9]{2})*$/i);
		});

		it('should handle empty card ID', () => {
			expect(formatCardId('')).toBe('');
		});

		it('should preserve uppercase', () => {
			const cardId = 'cb51000000012345';
			const formatted = formatCardId(cardId);
			expect(formatted).toBe(formatted.toUpperCase());
		});
	});

	describe('parseSettingsMask', () => {
		it('should parse settings mask correctly', () => {
			const mask = 0x0001; // PIN enabled
			const settings = parseSettingsMask(mask);
			expect(settings).toHaveProperty('isReusable');
			expect(settings).toHaveProperty('useActivation');
		});

		it('should handle zero mask', () => {
			const settings = parseSettingsMask(0);
			expect(settings).toBeDefined();
		});

		it('should return all boolean values', () => {
			const settings = parseSettingsMask(0xFFFF);
			Object.values(settings).forEach(value => {
				expect(typeof value).toBe('boolean');
			});
		});
	});

	describe('getCardStatus', () => {
		it('should return valid status for status code', () => {
			const status = getCardStatus(0);
			expect(status).toHaveProperty('code');
			expect(status).toHaveProperty('description');
		});

		it('should handle unknown status codes', () => {
			const status = getCardStatus(999);
			expect(status.description).toContain('Unknown');
		});
	});

	describe('calculateHealthScore', () => {
		it('should return score between 0 and 100', () => {
			const score = calculateHealthScore({
				remainingSignatures: 1000000,
				firmwareVersion: '6.35.0',
				isActivated: true,
				hasBackup: true,
			});
			expect(score).toBeGreaterThanOrEqual(0);
			expect(score).toBeLessThanOrEqual(100);
		});

		it('should give higher score to cards with backup', () => {
			const withBackup = calculateHealthScore({
				remainingSignatures: 1000000,
				firmwareVersion: '6.35.0',
				isActivated: true,
				hasBackup: true,
			});
			const withoutBackup = calculateHealthScore({
				remainingSignatures: 1000000,
				firmwareVersion: '6.35.0',
				isActivated: true,
				hasBackup: false,
			});
			expect(withBackup).toBeGreaterThan(withoutBackup);
		});
	});

	describe('validateCardId', () => {
		it('should validate correct card ID format', () => {
			expect(validateCardId('CB51000000012345')).toBe(true);
		});

		it('should reject invalid card ID', () => {
			expect(validateCardId('invalid')).toBe(false);
		});

		it('should reject empty string', () => {
			expect(validateCardId('')).toBe(false);
		});
	});
});
