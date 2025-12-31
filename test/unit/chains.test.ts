/* Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	SUPPORTED_CHAINS,
	CHAIN_CONFIGS,
	getChainById,
	getChainBySymbol,
	isEvmChain,
} from '../../nodes/Tangem/constants/chains';

describe('Chain Constants', () => {
	describe('SUPPORTED_CHAINS', () => {
		it('should contain Ethereum', () => {
			expect(SUPPORTED_CHAINS.ethereum).toBeDefined();
			expect(SUPPORTED_CHAINS.ethereum.name).toBe('Ethereum');
		});

		it('should contain Bitcoin', () => {
			expect(SUPPORTED_CHAINS.bitcoin).toBeDefined();
			expect(SUPPORTED_CHAINS.bitcoin.symbol).toBe('BTC');
		});

		it('should have at least 50 chains', () => {
			const chainCount = Object.keys(SUPPORTED_CHAINS).length;
			expect(chainCount).toBeGreaterThanOrEqual(50);
		});

		it('should have chainId for EVM chains', () => {
			expect(SUPPORTED_CHAINS.ethereum.chainId).toBe(1);
			expect(SUPPORTED_CHAINS.polygon.chainId).toBe(137);
		});
	});

	describe('CHAIN_CONFIGS', () => {
		it('should have config for each supported chain', () => {
			Object.keys(SUPPORTED_CHAINS).forEach(chainId => {
				expect(CHAIN_CONFIGS[chainId]).toBeDefined();
			});
		});

		it('should include explorer URL', () => {
			expect(CHAIN_CONFIGS.ethereum.explorerUrl).toContain('etherscan');
		});

		it('should specify curve for each chain', () => {
			Object.values(CHAIN_CONFIGS).forEach(config => {
				expect(config.curve).toBeDefined();
			});
		});
	});

	describe('getChainById', () => {
		it('should return chain by ID', () => {
			const chain = getChainById('ethereum');
			expect(chain).toBeDefined();
			expect(chain?.name).toBe('Ethereum');
		});

		it('should return undefined for invalid ID', () => {
			const chain = getChainById('invalid');
			expect(chain).toBeUndefined();
		});
	});

	describe('getChainBySymbol', () => {
		it('should return chain by symbol', () => {
			const chain = getChainBySymbol('ETH');
			expect(chain).toBeDefined();
			expect(chain?.name).toBe('Ethereum');
		});

		it('should be case insensitive', () => {
			const chain1 = getChainBySymbol('eth');
			const chain2 = getChainBySymbol('ETH');
			expect(chain1).toEqual(chain2);
		});
	});

	describe('isEvmChain', () => {
		it('should return true for Ethereum', () => {
			expect(isEvmChain('ethereum')).toBe(true);
		});

		it('should return true for Polygon', () => {
			expect(isEvmChain('polygon')).toBe(true);
		});

		it('should return false for Bitcoin', () => {
			expect(isEvmChain('bitcoin')).toBe(false);
		});

		it('should return false for Solana', () => {
			expect(isEvmChain('solana')).toBe(false);
		});
	});
});
