/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Tangem Network Credentials
 *
 * Credentials for connecting to blockchain networks used with Tangem cards.
 * Supports multiple blockchain networks including EVM chains, Bitcoin, Solana, etc.
 */
export class TangemNetwork implements ICredentialType {
  name = 'tangemNetwork';
  displayName = 'Tangem Network';
  documentationUrl = 'https://docs.tangem.com/';
  properties: INodeProperties[] = [
    {
      displayName: 'Network Type',
      name: 'networkType',
      type: 'options',
      options: [
        { name: 'EVM Compatible', value: 'evm' },
        { name: 'Bitcoin', value: 'bitcoin' },
        { name: 'Solana', value: 'solana' },
        { name: 'Cardano', value: 'cardano' },
        { name: 'XRP Ledger', value: 'xrp' },
        { name: 'Stellar', value: 'stellar' },
        { name: 'Polkadot', value: 'polkadot' },
        { name: 'Cosmos', value: 'cosmos' },
        { name: 'Near', value: 'near' },
        { name: 'Tron', value: 'tron' },
      ],
      default: 'evm',
      description: 'The type of blockchain network',
    },
    {
      displayName: 'EVM Network',
      name: 'evmNetwork',
      type: 'options',
      options: [
        { name: 'Ethereum Mainnet', value: 'ethereum' },
        { name: 'Ethereum Sepolia', value: 'sepolia' },
        { name: 'Ethereum Goerli', value: 'goerli' },
        { name: 'BNB Smart Chain', value: 'bsc' },
        { name: 'BNB Testnet', value: 'bscTestnet' },
        { name: 'Polygon', value: 'polygon' },
        { name: 'Polygon Mumbai', value: 'polygonMumbai' },
        { name: 'Arbitrum One', value: 'arbitrum' },
        { name: 'Arbitrum Sepolia', value: 'arbitrumSepolia' },
        { name: 'Optimism', value: 'optimism' },
        { name: 'Optimism Sepolia', value: 'optimismSepolia' },
        { name: 'Avalanche C-Chain', value: 'avalanche' },
        { name: 'Avalanche Fuji', value: 'avalancheFuji' },
        { name: 'Base', value: 'base' },
        { name: 'Base Sepolia', value: 'baseSepolia' },
        { name: 'Fantom', value: 'fantom' },
        { name: 'Gnosis Chain', value: 'gnosis' },
        { name: 'Cronos', value: 'cronos' },
        { name: 'zkSync Era', value: 'zksync' },
        { name: 'Linea', value: 'linea' },
        { name: 'Scroll', value: 'scroll' },
        { name: 'Mantle', value: 'mantle' },
        { name: 'Blast', value: 'blast' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'ethereum',
      description: 'Select an EVM-compatible network',
      displayOptions: {
        show: {
          networkType: ['evm'],
        },
      },
    },
    {
      displayName: 'Bitcoin Network',
      name: 'bitcoinNetwork',
      type: 'options',
      options: [
        { name: 'Bitcoin Mainnet', value: 'mainnet' },
        { name: 'Bitcoin Testnet', value: 'testnet' },
        { name: 'Bitcoin Signet', value: 'signet' },
      ],
      default: 'mainnet',
      description: 'Select a Bitcoin network',
      displayOptions: {
        show: {
          networkType: ['bitcoin'],
        },
      },
    },
    {
      displayName: 'Solana Cluster',
      name: 'solanaCluster',
      type: 'options',
      options: [
        { name: 'Mainnet Beta', value: 'mainnet-beta' },
        { name: 'Testnet', value: 'testnet' },
        { name: 'Devnet', value: 'devnet' },
      ],
      default: 'mainnet-beta',
      description: 'Select a Solana cluster',
      displayOptions: {
        show: {
          networkType: ['solana'],
        },
      },
    },
    {
      displayName: 'Cardano Network',
      name: 'cardanoNetwork',
      type: 'options',
      options: [
        { name: 'Mainnet', value: 'mainnet' },
        { name: 'Preprod', value: 'preprod' },
        { name: 'Preview', value: 'preview' },
      ],
      default: 'mainnet',
      description: 'Select a Cardano network',
      displayOptions: {
        show: {
          networkType: ['cardano'],
        },
      },
    },
    {
      displayName: 'XRP Network',
      name: 'xrpNetwork',
      type: 'options',
      options: [
        { name: 'Mainnet', value: 'mainnet' },
        { name: 'Testnet', value: 'testnet' },
        { name: 'Devnet', value: 'devnet' },
      ],
      default: 'mainnet',
      description: 'Select an XRP network',
      displayOptions: {
        show: {
          networkType: ['xrp'],
        },
      },
    },
    {
      displayName: 'Stellar Network',
      name: 'stellarNetwork',
      type: 'options',
      options: [
        { name: 'Public Network', value: 'public' },
        { name: 'Test Network', value: 'testnet' },
      ],
      default: 'public',
      description: 'Select a Stellar network',
      displayOptions: {
        show: {
          networkType: ['stellar'],
        },
      },
    },
    {
      displayName: 'Polkadot Network',
      name: 'polkadotNetwork',
      type: 'options',
      options: [
        { name: 'Polkadot', value: 'polkadot' },
        { name: 'Kusama', value: 'kusama' },
        { name: 'Westend', value: 'westend' },
      ],
      default: 'polkadot',
      description: 'Select a Polkadot/Substrate network',
      displayOptions: {
        show: {
          networkType: ['polkadot'],
        },
      },
    },
    {
      displayName: 'Cosmos Chain',
      name: 'cosmosChain',
      type: 'options',
      options: [
        { name: 'Cosmos Hub', value: 'cosmoshub' },
        { name: 'Osmosis', value: 'osmosis' },
        { name: 'Juno', value: 'juno' },
        { name: 'Kava', value: 'kava' },
        { name: 'Evmos', value: 'evmos' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'cosmoshub',
      description: 'Select a Cosmos-based chain',
      displayOptions: {
        show: {
          networkType: ['cosmos'],
        },
      },
    },
    {
      displayName: 'Near Network',
      name: 'nearNetwork',
      type: 'options',
      options: [
        { name: 'Mainnet', value: 'mainnet' },
        { name: 'Testnet', value: 'testnet' },
      ],
      default: 'mainnet',
      description: 'Select a Near network',
      displayOptions: {
        show: {
          networkType: ['near'],
        },
      },
    },
    {
      displayName: 'Tron Network',
      name: 'tronNetwork',
      type: 'options',
      options: [
        { name: 'Mainnet', value: 'mainnet' },
        { name: 'Shasta Testnet', value: 'shasta' },
        { name: 'Nile Testnet', value: 'nile' },
      ],
      default: 'mainnet',
      description: 'Select a Tron network',
      displayOptions: {
        show: {
          networkType: ['tron'],
        },
      },
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      description: 'Custom RPC endpoint URL (leave empty for default)',
      placeholder: 'https://mainnet.infura.io/v3/YOUR-API-KEY',
    },
    {
      displayName: 'Block Explorer URL',
      name: 'explorerUrl',
      type: 'string',
      default: '',
      description: 'Block explorer URL for transaction verification',
      placeholder: 'https://etherscan.io',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      description: 'The chain ID for EVM networks',
      displayOptions: {
        show: {
          networkType: ['evm'],
          evmNetwork: ['custom'],
        },
      },
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for RPC provider (if required)',
    },
    {
      displayName: 'Advanced Settings',
      name: 'advancedSettings',
      type: 'collection',
      default: {},
      options: [
        {
          displayName: 'Request Timeout (ms)',
          name: 'requestTimeout',
          type: 'number',
          default: 30000,
          description: 'Timeout for network requests in milliseconds',
        },
        {
          displayName: 'Max Retries',
          name: 'maxRetries',
          type: 'number',
          default: 3,
          description: 'Maximum number of retry attempts',
        },
        {
          displayName: 'Gas Price Multiplier',
          name: 'gasPriceMultiplier',
          type: 'number',
          default: 1.1,
          description: 'Multiplier for gas price estimation (EVM only)',
        },
        {
          displayName: 'Use Websocket',
          name: 'useWebsocket',
          type: 'boolean',
          default: false,
          description: 'Whether to use WebSocket connection',
        },
        {
          displayName: 'Websocket URL',
          name: 'websocketUrl',
          type: 'string',
          default: '',
          description: 'WebSocket endpoint URL',
        },
      ],
      description: 'Advanced network configuration options',
    },
  ];
}
