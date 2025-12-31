/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	NodeConnectionType,
} from 'n8n-workflow';

import * as card from './actions/card';
import * as wallet from './actions/wallet';
import * as multiCard from './actions/multiCard';
import * as account from './actions/account';
import * as bitcoin from './actions/bitcoin';
import * as ethereum from './actions/ethereum';
import * as evmChains from './actions/evmChains';
import * as solana from './actions/solana';
import * as cardano from './actions/cardano';
import * as xrp from './actions/xrp';
import * as stellar from './actions/stellar';
import * as polkadot from './actions/polkadot';
import * as cosmos from './actions/cosmos';
import * as near from './actions/near';
import * as tron from './actions/tron';
import * as token from './actions/token';
import * as transaction from './actions/transaction';
import * as signing from './actions/signing';
import * as hdWallet from './actions/hdWallet';
import * as backup from './actions/backup';
import * as pin from './actions/pin';
import * as security from './actions/security';
import * as nfc from './actions/nfc';
import * as tangemApp from './actions/tangemApp';
import * as firmware from './actions/firmware';
import * as utility from './actions/utility';

export class Tangem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tangem',
		name: 'tangem',
		icon: 'file:tangem.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Tangem NFC hardware wallet cards for multi-chain cryptocurrency operations',
		defaults: {
			name: 'Tangem',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'tangemCard',
				required: true,
			},
			{
				name: 'tangemNetwork',
				required: false,
			},
			{
				name: 'tangemApp',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Backup', value: 'backup' },
					{ name: 'Bitcoin', value: 'bitcoin' },
					{ name: 'Card', value: 'card' },
					{ name: 'Cardano', value: 'cardano' },
					{ name: 'Cosmos', value: 'cosmos' },
					{ name: 'Ethereum', value: 'ethereum' },
					{ name: 'EVM Chains', value: 'evmChains' },
					{ name: 'Firmware', value: 'firmware' },
					{ name: 'HD Wallet', value: 'hdWallet' },
					{ name: 'Multi-Card', value: 'multiCard' },
					{ name: 'Near', value: 'near' },
					{ name: 'NFC', value: 'nfc' },
					{ name: 'PIN', value: 'pin' },
					{ name: 'Polkadot', value: 'polkadot' },
					{ name: 'Security', value: 'security' },
					{ name: 'Signing', value: 'signing' },
					{ name: 'Solana', value: 'solana' },
					{ name: 'Stellar', value: 'stellar' },
					{ name: 'Tangem App', value: 'tangemApp' },
					{ name: 'Token', value: 'token' },
					{ name: 'Transaction', value: 'transaction' },
					{ name: 'Tron', value: 'tron' },
					{ name: 'Utility', value: 'utility' },
					{ name: 'Wallet', value: 'wallet' },
					{ name: 'XRP', value: 'xrp' },
				],
				default: 'card',
			},

			// Card Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['card'],
					},
				},
				options: [
					{ name: 'Check Authenticity', value: 'checkAuthenticity', description: 'Verify card authenticity using attestation', action: 'Check card authenticity' },
					{ name: 'Get Attestation', value: 'getAttestation', description: 'Get card attestation data', action: 'Get attestation' },
					{ name: 'Get Batch ID', value: 'getBatchId', description: 'Get the manufacturing batch ID', action: 'Get batch ID' },
					{ name: 'Get Card ID', value: 'getCardId', description: 'Get the unique card identifier (CID)', action: 'Get card ID' },
					{ name: 'Get Card Info', value: 'getCardInfo', description: 'Get comprehensive card information', action: 'Get card info' },
					{ name: 'Get Firmware Version', value: 'getFirmwareVersion', description: 'Get card firmware version', action: 'Get firmware version' },
					{ name: 'Get Health Status', value: 'getHealthStatus', description: 'Get card health and remaining signatures', action: 'Get health status' },
					{ name: 'Get Manufacturer', value: 'getManufacturer', description: 'Get card manufacturer information', action: 'Get manufacturer' },
					{ name: 'Get PIN Status', value: 'getPinStatus', description: 'Check if PIN is set on the card', action: 'Get PIN status' },
					{ name: 'Get Product Mask', value: 'getProductMask', description: 'Get product type mask', action: 'Get product mask' },
					{ name: 'Get Remaining Signatures', value: 'getRemainingSignatures', description: 'Get count of remaining signatures', action: 'Get remaining signatures' },
					{ name: 'Get Settings Mask', value: 'getSettingsMask', description: 'Get card settings and capabilities', action: 'Get settings mask' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get current card status', action: 'Get status' },
					{ name: 'Is Activated', value: 'isActivated', description: 'Check if card is activated', action: 'Is activated' },
					{ name: 'Scan', value: 'scan', description: 'Scan Tangem card via NFC', action: 'Scan card' },
				],
				default: 'scan',
			},

			// Wallet Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['wallet'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create a new wallet on the card', action: 'Create wallet' },
					{ name: 'Derive Addresses', value: 'deriveAddresses', description: 'Derive addresses for multiple chains', action: 'Derive addresses' },
					{ name: 'Get Addresses', value: 'getAddresses', description: 'Get all addresses for a wallet', action: 'Get addresses' },
					{ name: 'Get Curve', value: 'getCurve', description: 'Get wallet elliptic curve', action: 'Get curve' },
					{ name: 'Get HD Info', value: 'getHdInfo', description: 'Get HD wallet information', action: 'Get HD info' },
					{ name: 'Get Index', value: 'getIndex', description: 'Get wallet index', action: 'Get index' },
					{ name: 'Get Public Key', value: 'getPublicKey', description: 'Get wallet public key', action: 'Get public key' },
					{ name: 'Get Settings', value: 'getSettings', description: 'Get wallet settings', action: 'Get settings' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get wallet status', action: 'Get status' },
					{ name: 'Get Wallet', value: 'getWallet', description: 'Get wallet details', action: 'Get wallet' },
					{ name: 'Purge', value: 'purge', description: 'Purge wallet from card', action: 'Purge wallet' },
				],
				default: 'getWallet',
			},

			// Multi-Card Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['multiCard'],
					},
				},
				options: [
					{ name: 'Activate Set', value: 'activateSet', description: 'Activate linked card set', action: 'Activate set' },
					{ name: 'Check Integrity', value: 'checkIntegrity', description: 'Verify card set integrity', action: 'Check integrity' },
					{ name: 'Get Backup Cards', value: 'getBackupCards', description: 'Get backup card information', action: 'Get backup cards' },
					{ name: 'Get Backup Status', value: 'getBackupStatus', description: 'Get backup process status', action: 'Get backup status' },
					{ name: 'Get Primary Card', value: 'getPrimaryCard', description: 'Get primary card information', action: 'Get primary card' },
					{ name: 'Get Set Info', value: 'getSetInfo', description: 'Get card set information', action: 'Get set info' },
					{ name: 'Get Set PIN Status', value: 'getSetPinStatus', description: 'Get PIN status for card set', action: 'Get set PIN status' },
					{ name: 'Link Backup', value: 'linkBackup', description: 'Link a backup card', action: 'Link backup' },
					{ name: 'Read Backup Card', value: 'readBackupCard', description: 'Read data from backup card', action: 'Read backup card' },
					{ name: 'Read Primary Card', value: 'readPrimaryCard', description: 'Read data from primary card', action: 'Read primary card' },
				],
				default: 'getSetInfo',
			},

			// Account Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{ name: 'Add Account', value: 'addAccount', description: 'Add a new blockchain account', action: 'Add account' },
					{ name: 'Get Account Address', value: 'getAccountAddress', description: 'Get address for account', action: 'Get account address' },
					{ name: 'Get Account Balance', value: 'getAccountBalance', description: 'Get balance for account', action: 'Get account balance' },
					{ name: 'Get Account by Chain', value: 'getAccountByChain', description: 'Get account for specific chain', action: 'Get account by chain' },
					{ name: 'Get Account History', value: 'getAccountHistory', description: 'Get transaction history', action: 'Get account history' },
					{ name: 'Get Accounts', value: 'getAccounts', description: 'Get all accounts', action: 'Get accounts' },
					{ name: 'Get All Addresses', value: 'getAllAddresses', description: 'Get addresses for all accounts', action: 'Get all addresses' },
					{ name: 'Get Multi-Chain Balances', value: 'getMultiChainBalances', description: 'Get balances across chains', action: 'Get multi-chain balances' },
					{ name: 'Remove Account', value: 'removeAccount', description: 'Remove an account', action: 'Remove account' },
					{ name: 'Sync Account', value: 'syncAccount', description: 'Sync account data', action: 'Sync account' },
				],
				default: 'getAccounts',
			},

			// Bitcoin Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['bitcoin'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Create Transaction', value: 'createTransaction', description: 'Create Bitcoin transaction', action: 'Create transaction' },
					{ name: 'Estimate Fee', value: 'estimateFee', description: 'Estimate transaction fee', action: 'Estimate fee' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Bitcoin address', action: 'Get address' },
					{ name: 'Get Public Key', value: 'getPublicKey', description: 'Get Bitcoin public key', action: 'Get public key' },
					{ name: 'Get UTXO', value: 'getUtxo', description: 'Get unspent transaction outputs', action: 'Get UTXO' },
					{ name: 'Sign Message', value: 'signMessage', description: 'Sign a message', action: 'Sign message' },
					{ name: 'Sign PSBT', value: 'signPsbt', description: 'Sign Partially Signed Bitcoin Transaction', action: 'Sign PSBT' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Bitcoin transaction', action: 'Sign transaction' },
					{ name: 'Verify Message', value: 'verifyMessage', description: 'Verify signed message', action: 'Verify message' },
				],
				default: 'getAddress',
			},

			// Ethereum Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['ethereum'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate transaction gas', action: 'Estimate gas' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Ethereum address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get ETH balance', action: 'Get balance' },
					{ name: 'Get Nonce', value: 'getNonce', description: 'Get account nonce', action: 'Get nonce' },
					{ name: 'Get Token Balances', value: 'getTokenBalances', description: 'Get ERC-20 token balances', action: 'Get token balances' },
					{ name: 'Sign EIP-1559 Transaction', value: 'signEip1559Transaction', description: 'Sign EIP-1559 transaction', action: 'Sign EIP-1559 transaction' },
					{ name: 'Sign Legacy Transaction', value: 'signLegacyTransaction', description: 'Sign legacy transaction', action: 'Sign legacy transaction' },
					{ name: 'Sign Message', value: 'signMessage', description: 'Sign message', action: 'Sign message' },
					{ name: 'Sign Personal Message', value: 'signPersonalMessage', description: 'Sign personal message', action: 'Sign personal message' },
					{ name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign EIP-712 typed data', action: 'Sign typed data' },
				],
				default: 'getAddress',
			},

			// EVM Chains Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['evmChains'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get address for EVM chain', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get native balance', action: 'Get balance' },
					{ name: 'Sign Message', value: 'signMessage', description: 'Sign message', action: 'Sign message' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
					{ name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign EIP-712 typed data', action: 'Sign typed data' },
				],
				default: 'getAddress',
			},

			// Solana Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['solana'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Solana address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get SOL balance', action: 'Get balance' },
					{ name: 'Get Public Key', value: 'getPublicKey', description: 'Get Solana public key', action: 'Get public key' },
					{ name: 'Get Token Accounts', value: 'getTokenAccounts', description: 'Get SPL token accounts', action: 'Get token accounts' },
					{ name: 'Sign Message', value: 'signMessage', description: 'Sign message', action: 'Sign message' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Solana transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// Cardano Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['cardano'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Cardano address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get ADA balance', action: 'Get balance' },
					{ name: 'Get Staking Key', value: 'getStakingKey', description: 'Get staking key', action: 'Get staking key' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Cardano transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// XRP Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['xrp'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Account Info', value: 'getAccountInfo', description: 'Get XRP account info', action: 'Get account info' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get XRP address', action: 'Get address' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign XRP transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// Stellar Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['stellar'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Stellar address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get XLM balance', action: 'Get balance' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Stellar transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// Polkadot Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['polkadot'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed extrinsic', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Polkadot address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get DOT balance', action: 'Get balance' },
					{ name: 'Sign Extrinsic', value: 'signExtrinsic', description: 'Sign Polkadot extrinsic', action: 'Sign extrinsic' },
				],
				default: 'getAddress',
			},

			// Cosmos Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['cosmos'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Cosmos address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get ATOM balance', action: 'Get balance' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Cosmos transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// Near Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['near'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get NEAR address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get NEAR balance', action: 'Get balance' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign NEAR transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// Tron Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['tron'],
					},
				},
				options: [
					{ name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
					{ name: 'Get Address', value: 'getAddress', description: 'Get Tron address', action: 'Get address' },
					{ name: 'Get Balance', value: 'getBalance', description: 'Get TRX balance', action: 'Get balance' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Tron transaction', action: 'Sign transaction' },
				],
				default: 'getAddress',
			},

			// Token Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['token'],
					},
				},
				options: [
					{ name: 'Add Custom Token', value: 'addCustomToken', description: 'Add a custom token', action: 'Add custom token' },
					{ name: 'Get NFTs', value: 'getNfts', description: 'Get NFT tokens', action: 'Get NFTs' },
					{ name: 'Get Supported Tokens', value: 'getSupportedTokens', description: 'Get list of supported tokens', action: 'Get supported tokens' },
					{ name: 'Get Token Balance', value: 'getTokenBalance', description: 'Get token balance', action: 'Get token balance' },
					{ name: 'Get Token Info', value: 'getTokenInfo', description: 'Get token information', action: 'Get token info' },
					{ name: 'Sign NFT Transfer', value: 'signNftTransfer', description: 'Sign NFT transfer', action: 'Sign NFT transfer' },
					{ name: 'Sign Token Approval', value: 'signTokenApproval', description: 'Sign token approval', action: 'Sign token approval' },
					{ name: 'Sign Token Transfer', value: 'signTokenTransfer', description: 'Sign token transfer', action: 'Sign token transfer' },
				],
				default: 'getTokenBalance',
			},

			// Transaction Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['transaction'],
					},
				},
				options: [
					{ name: 'Broadcast', value: 'broadcast', description: 'Broadcast transaction', action: 'Broadcast' },
					{ name: 'Create', value: 'create', description: 'Create transaction', action: 'Create' },
					{ name: 'Estimate Fee', value: 'estimateFee', description: 'Estimate transaction fee', action: 'Estimate fee' },
					{ name: 'Get Fee', value: 'getFee', description: 'Get transaction fee', action: 'Get fee' },
					{ name: 'Get History', value: 'getHistory', description: 'Get transaction history', action: 'Get history' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get transaction status', action: 'Get status' },
					{ name: 'Sign', value: 'sign', description: 'Sign transaction', action: 'Sign' },
					{ name: 'Verify', value: 'verify', description: 'Verify transaction', action: 'Verify' },
				],
				default: 'create',
			},

			// Signing Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['signing'],
					},
				},
				options: [
					{ name: 'Batch Sign', value: 'batchSign', description: 'Sign multiple hashes', action: 'Batch sign' },
					{ name: 'Get Signature', value: 'getSignature', description: 'Get signature details', action: 'Get signature' },
					{ name: 'Sign Data', value: 'signData', description: 'Sign arbitrary data', action: 'Sign data' },
					{ name: 'Sign Hash', value: 'signHash', description: 'Sign a hash', action: 'Sign hash' },
					{ name: 'Sign Message', value: 'signMessage', description: 'Sign a message', action: 'Sign message' },
					{ name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
					{ name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign typed data', action: 'Sign typed data' },
					{ name: 'Verify Signature', value: 'verifySignature', description: 'Verify a signature', action: 'Verify signature' },
				],
				default: 'signHash',
			},

			// HD Wallet Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['hdWallet'],
					},
				},
				options: [
					{ name: 'Create', value: 'create', description: 'Create HD wallet', action: 'Create' },
					{ name: 'Derive Key', value: 'deriveKey', description: 'Derive child key', action: 'Derive key' },
					{ name: 'Get Child Public Key', value: 'getChildPublicKey', description: 'Get child public key', action: 'Get child public key' },
					{ name: 'Get Derivation Path', value: 'getDerivationPath', description: 'Get derivation path', action: 'Get derivation path' },
					{ name: 'Get Derived Address', value: 'getDerivedAddress', description: 'Get derived address', action: 'Get derived address' },
					{ name: 'Get Extended Public Key', value: 'getExtendedPublicKey', description: 'Get extended public key', action: 'Get extended public key' },
					{ name: 'Get Info', value: 'getInfo', description: 'Get HD wallet info', action: 'Get info' },
				],
				default: 'getInfo',
			},

			// Backup Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['backup'],
					},
				},
				options: [
					{ name: 'Finalize', value: 'finalize', description: 'Finalize backup process', action: 'Finalize' },
					{ name: 'Get Card Count', value: 'getCardCount', description: 'Get backup card count', action: 'Get card count' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get backup status', action: 'Get status' },
					{ name: 'Read Card', value: 'readCard', description: 'Read backup card', action: 'Read card' },
					{ name: 'Start', value: 'start', description: 'Start backup process', action: 'Start' },
					{ name: 'Verify', value: 'verify', description: 'Verify backup', action: 'Verify' },
					{ name: 'Write Card', value: 'writeCard', description: 'Write backup card', action: 'Write card' },
				],
				default: 'getStatus',
			},

			// PIN Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pin'],
					},
				},
				options: [
					{ name: 'Change Access Code', value: 'changeAccessCode', description: 'Change access code', action: 'Change access code' },
					{ name: 'Change Passcode', value: 'changePasscode', description: 'Change passcode', action: 'Change passcode' },
					{ name: 'Get Access Code Status', value: 'getAccessCodeStatus', description: 'Get access code status', action: 'Get access code status' },
					{ name: 'Is PIN Set', value: 'isPinSet', description: 'Check if PIN is set', action: 'Is PIN set' },
					{ name: 'Reset Access Code', value: 'resetAccessCode', description: 'Reset access code', action: 'Reset access code' },
					{ name: 'Reset Passcode', value: 'resetPasscode', description: 'Reset passcode', action: 'Reset passcode' },
					{ name: 'Set Access Code', value: 'setAccessCode', description: 'Set access code', action: 'Set access code' },
					{ name: 'Set Passcode', value: 'setPasscode', description: 'Set passcode', action: 'Set passcode' },
				],
				default: 'isPinSet',
			},

			// Security Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['security'],
					},
				},
				options: [
					{ name: 'Check Tampering', value: 'checkTampering', description: 'Check for card tampering', action: 'Check tampering' },
					{ name: 'Get Attestation', value: 'getAttestation', description: 'Get card attestation', action: 'Get attestation' },
					{ name: 'Get Health Check', value: 'getHealthCheck', description: 'Get security health check', action: 'Get health check' },
					{ name: 'Get Security Delay', value: 'getSecurityDelay', description: 'Get security delay', action: 'Get security delay' },
					{ name: 'Get Settings Mask', value: 'getSettingsMask', description: 'Get security settings', action: 'Get settings mask' },
					{ name: 'Get Signing Methods', value: 'getSigningMethods', description: 'Get allowed signing methods', action: 'Get signing methods' },
					{ name: 'Set Security Delay', value: 'setSecurityDelay', description: 'Set security delay', action: 'Set security delay' },
					{ name: 'Verify Authenticity', value: 'verifyAuthenticity', description: 'Verify card authenticity', action: 'Verify authenticity' },
				],
				default: 'verifyAuthenticity',
			},

			// NFC Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['nfc'],
					},
				},
				options: [
					{ name: 'Cancel', value: 'cancel', description: 'Cancel NFC operation', action: 'Cancel' },
					{ name: 'Get Reader Info', value: 'getReaderInfo', description: 'Get NFC reader information', action: 'Get reader info' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get NFC status', action: 'Get status' },
					{ name: 'Initialize', value: 'initialize', description: 'Initialize NFC', action: 'Initialize' },
					{ name: 'Read Card', value: 'readCard', description: 'Read NFC card', action: 'Read card' },
					{ name: 'Scan', value: 'scan', description: 'Scan for NFC card', action: 'Scan' },
					{ name: 'Set Timeout', value: 'setTimeout', description: 'Set NFC timeout', action: 'Set timeout' },
					{ name: 'Write Card', value: 'writeCard', description: 'Write to NFC card', action: 'Write card' },
				],
				default: 'scan',
			},

			// Tangem App Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['tangemApp'],
					},
				},
				options: [
					{ name: 'Export', value: 'export', description: 'Export data to app', action: 'Export' },
					{ name: 'Get Portfolio', value: 'getPortfolio', description: 'Get app portfolio', action: 'Get portfolio' },
					{ name: 'Get Transactions', value: 'getTransactions', description: 'Get app transactions', action: 'Get transactions' },
					{ name: 'Import', value: 'import', description: 'Import data from app', action: 'Import' },
					{ name: 'Sync', value: 'sync', description: 'Sync with app', action: 'Sync' },
				],
				default: 'sync',
			},

			// Firmware Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['firmware'],
					},
				},
				options: [
					{ name: 'Check Updates', value: 'checkUpdates', description: 'Check for firmware updates', action: 'Check updates' },
					{ name: 'Get Batch Info', value: 'getBatchInfo', description: 'Get batch information', action: 'Get batch info' },
					{ name: 'Get Capabilities', value: 'getCapabilities', description: 'Get firmware capabilities', action: 'Get capabilities' },
					{ name: 'Get Generation', value: 'getGeneration', description: 'Get card generation', action: 'Get generation' },
					{ name: 'Get Version', value: 'getVersion', description: 'Get firmware version', action: 'Get version' },
				],
				default: 'getVersion',
			},

			// Utility Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['utility'],
					},
				},
				options: [
					{ name: 'Convert Address', value: 'convertAddress', description: 'Convert address format', action: 'Convert address' },
					{ name: 'Get Card Limits', value: 'getCardLimits', description: 'Get card limits', action: 'Get card limits' },
					{ name: 'Get Derivation Path', value: 'getDerivationPath', description: 'Get derivation path for chain', action: 'Get derivation path' },
					{ name: 'Get Supported Blockchains', value: 'getSupportedBlockchains', description: 'Get supported blockchains', action: 'Get supported blockchains' },
					{ name: 'Get Supported Curves', value: 'getSupportedCurves', description: 'Get supported curves', action: 'Get supported curves' },
					{ name: 'Test NFC', value: 'testNfc', description: 'Test NFC connection', action: 'Test NFC' },
					{ name: 'Validate Address', value: 'validateAddress', description: 'Validate blockchain address', action: 'Validate address' },
				],
				default: 'getSupportedBlockchains',
			},

			// Common Parameters
			{
				displayName: 'Wallet Index',
				name: 'walletIndex',
				type: 'number',
				default: 0,
				description: 'Index of the wallet to use (0 for first wallet)',
				displayOptions: {
					show: {
						resource: ['wallet', 'bitcoin', 'ethereum', 'evmChains', 'solana', 'cardano', 'xrp', 'stellar', 'polkadot', 'cosmos', 'near', 'tron', 'signing', 'hdWallet'],
					},
				},
			},
			{
				displayName: 'Chain',
				name: 'chain',
				type: 'options',
				default: 'ethereum',
				description: 'Blockchain network to use',
				displayOptions: {
					show: {
						resource: ['evmChains'],
					},
				},
				options: [
					{ name: 'Arbitrum', value: 'arbitrum' },
					{ name: 'Avalanche C-Chain', value: 'avalanche' },
					{ name: 'Base', value: 'base' },
					{ name: 'Blast', value: 'blast' },
					{ name: 'BNB Chain', value: 'bsc' },
					{ name: 'Cronos', value: 'cronos' },
					{ name: 'Ethereum', value: 'ethereum' },
					{ name: 'Fantom', value: 'fantom' },
					{ name: 'Gnosis', value: 'gnosis' },
					{ name: 'Linea', value: 'linea' },
					{ name: 'Mantle', value: 'mantle' },
					{ name: 'Optimism', value: 'optimism' },
					{ name: 'Polygon', value: 'polygon' },
					{ name: 'Scroll', value: 'scroll' },
					{ name: 'zkSync Era', value: 'zksync' },
				],
			},
			{
				displayName: 'Derivation Path',
				name: 'derivationPath',
				type: 'string',
				default: '',
				placeholder: "m/44'/60'/0'/0/0",
				description: 'BIP-44 derivation path (leave empty for default)',
				displayOptions: {
					show: {
						resource: ['hdWallet', 'wallet'],
						operation: ['deriveKey', 'getDerivedAddress', 'deriveAddresses'],
					},
				},
			},
			{
				displayName: 'Hash',
				name: 'hash',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Hash to sign (32 bytes hex)',
				displayOptions: {
					show: {
						resource: ['signing'],
						operation: ['signHash', 'batchSign'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message to sign',
				displayOptions: {
					show: {
						operation: ['signMessage', 'signPersonalMessage', 'verifyMessage'],
					},
				},
			},
			{
				displayName: 'Transaction Data',
				name: 'transactionData',
				type: 'json',
				default: '{}',
				description: 'Transaction data as JSON',
				displayOptions: {
					show: {
						operation: ['signTransaction', 'signEip1559Transaction', 'signLegacyTransaction', 'create', 'sign', 'createTransaction'],
					},
				},
			},
			{
				displayName: 'Typed Data',
				name: 'typedData',
				type: 'json',
				default: '{}',
				description: 'EIP-712 typed data as JSON',
				displayOptions: {
					show: {
						operation: ['signTypedData'],
					},
				},
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				description: 'Blockchain address',
				displayOptions: {
					show: {
						operation: ['getBalance', 'getTokenBalance', 'getTokenBalances', 'getNonce', 'getAccountInfo', 'validateAddress', 'convertAddress'],
					},
				},
			},
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Token contract address',
				displayOptions: {
					show: {
						operation: ['getTokenBalance', 'getTokenInfo', 'signTokenTransfer', 'signTokenApproval'],
					},
				},
			},
			{
				displayName: 'Access Code',
				name: 'accessCode',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Card access code (PIN)',
				displayOptions: {
					show: {
						operation: ['setAccessCode', 'changeAccessCode'],
					},
				},
			},
			{
				displayName: 'Passcode',
				name: 'passcode',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Card passcode (secondary PIN)',
				displayOptions: {
					show: {
						operation: ['setPasscode', 'changePasscode'],
					},
				},
			},
			{
				displayName: 'Elliptic Curve',
				name: 'curve',
				type: 'options',
				default: 'secp256k1',
				description: 'Elliptic curve for wallet creation',
				displayOptions: {
					show: {
						resource: ['wallet'],
						operation: ['create'],
					},
				},
				options: [
					{ name: 'Secp256k1', value: 'secp256k1', description: 'Bitcoin, Ethereum, and most chains' },
					{ name: 'Ed25519', value: 'ed25519', description: 'Solana, Cardano, Stellar, Polkadot' },
					{ name: 'Ed25519 SLIP-0010', value: 'ed25519Slip0010', description: 'Ed25519 with SLIP-0010 derivation' },
					{ name: 'Secp256r1 (P-256)', value: 'secp256r1', description: 'NIST P-256 curve' },
					{ name: 'BLS12-381 G2', value: 'bls12381G2', description: 'Ethereum 2.0 staking' },
					{ name: 'BIP-340 (Schnorr)', value: 'bip0340', description: 'Bitcoin Taproot' },
				],
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Address Format',
						name: 'addressFormat',
						type: 'options',
						default: 'default',
						options: [
							{ name: 'Default', value: 'default' },
							{ name: 'Legacy (P2PKH)', value: 'legacy' },
							{ name: 'SegWit (P2WPKH)', value: 'segwit' },
							{ name: 'Native SegWit (Bech32)', value: 'nativeSegwit' },
							{ name: 'Taproot (P2TR)', value: 'taproot' },
						],
						description: 'Bitcoin address format',
					},
					{
						displayName: 'Include Testnet',
						name: 'includeTestnet',
						type: 'boolean',
						default: false,
						description: 'Whether to include testnet networks',
					},
					{
						displayName: 'Max Results',
						name: 'maxResults',
						type: 'number',
						default: 100,
						description: 'Maximum number of results to return',
					},
					{
						displayName: 'Network',
						name: 'network',
						type: 'options',
						default: 'mainnet',
						options: [
							{ name: 'Mainnet', value: 'mainnet' },
							{ name: 'Testnet', value: 'testnet' },
						],
						description: 'Network to use',
					},
					{
						displayName: 'Timeout (ms)',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Operation timeout in milliseconds',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[] = [];

				switch (resource) {
					case 'card':
						result = await card.execute.call(this, i, operation);
						break;
					case 'wallet':
						result = await wallet.execute.call(this, i, operation);
						break;
					case 'multiCard':
						result = await multiCard.execute.call(this, i, operation);
						break;
					case 'account':
						result = await account.execute.call(this, i, operation);
						break;
					case 'bitcoin':
						result = await bitcoin.execute.call(this, i, operation);
						break;
					case 'ethereum':
						result = await ethereum.execute.call(this, i, operation);
						break;
					case 'evmChains':
						result = await evmChains.execute.call(this, i, operation);
						break;
					case 'solana':
						result = await solana.execute.call(this, i, operation);
						break;
					case 'cardano':
						result = await cardano.execute.call(this, i, operation);
						break;
					case 'xrp':
						result = await xrp.execute.call(this, i, operation);
						break;
					case 'stellar':
						result = await stellar.execute.call(this, i, operation);
						break;
					case 'polkadot':
						result = await polkadot.execute.call(this, i, operation);
						break;
					case 'cosmos':
						result = await cosmos.execute.call(this, i, operation);
						break;
					case 'near':
						result = await near.execute.call(this, i, operation);
						break;
					case 'tron':
						result = await tron.execute.call(this, i, operation);
						break;
					case 'token':
						result = await token.execute.call(this, i, operation);
						break;
					case 'transaction':
						result = await transaction.execute.call(this, i, operation);
						break;
					case 'signing':
						result = await signing.execute.call(this, i, operation);
						break;
					case 'hdWallet':
						result = await hdWallet.execute.call(this, i, operation);
						break;
					case 'backup':
						result = await backup.execute.call(this, i, operation);
						break;
					case 'pin':
						result = await pin.execute.call(this, i, operation);
						break;
					case 'security':
						result = await security.execute.call(this, i, operation);
						break;
					case 'nfc':
						result = await nfc.execute.call(this, i, operation);
						break;
					case 'tangemApp':
						result = await tangemApp.execute.call(this, i, operation);
						break;
					case 'firmware':
						result = await firmware.execute.call(this, i, operation);
						break;
					case 'utility':
						result = await utility.execute.call(this, i, operation);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
