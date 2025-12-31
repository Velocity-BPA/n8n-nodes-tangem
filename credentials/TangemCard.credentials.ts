/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  ICredentialType,
  INodeProperties,
  ICredentialTestRequest,
} from 'n8n-workflow';

/**
 * Tangem Card Credentials
 *
 * Credentials for authenticating with Tangem NFC hardware wallets.
 * Supports Tangem Wallet 2.0, Wallet 3, Tangem Note, and Tangem Ring.
 */
export class TangemCard implements ICredentialType {
  name = 'tangemCard';
  displayName = 'Tangem Card';
  documentationUrl = 'https://docs.tangem.com/';
  properties: INodeProperties[] = [
    {
      displayName: 'Card Type',
      name: 'cardType',
      type: 'options',
      options: [
        {
          name: 'Tangem Wallet 2.0 (2 Cards)',
          value: 'wallet2',
          description: 'Tangem Wallet 2.0 with 2-card backup system',
        },
        {
          name: 'Tangem Wallet (3 Cards)',
          value: 'wallet3',
          description: 'Tangem Wallet with 3-card backup system',
        },
        {
          name: 'Tangem Note',
          value: 'note',
          description: 'Single currency Tangem Note card',
        },
        {
          name: 'Tangem Ring',
          value: 'ring',
          description: 'Tangem Ring wearable NFC wallet',
        },
        {
          name: 'Custom Tangem Card',
          value: 'custom',
          description: 'Custom or developer Tangem card',
        },
      ],
      default: 'wallet3',
      description: 'The type of Tangem card being used',
    },
    {
      displayName: 'Card ID (CID)',
      name: 'cardId',
      type: 'string',
      default: '',
      required: true,
      description: 'The unique Card Identifier (CID) of your Tangem card',
      placeholder: 'CB12 3456 7890 ABCD',
    },
    {
      displayName: 'Wallet Public Key',
      name: 'walletPublicKey',
      type: 'string',
      default: '',
      description: 'The wallet public key (hex format) for verification',
      placeholder: '0x04...',
    },
    {
      displayName: 'NFC Reader Settings',
      name: 'nfcSettings',
      type: 'collection',
      default: {},
      options: [
        {
          displayName: 'Connection Timeout (ms)',
          name: 'connectionTimeout',
          type: 'number',
          default: 30000,
          description: 'Timeout for NFC connection in milliseconds',
        },
        {
          displayName: 'Read Timeout (ms)',
          name: 'readTimeout',
          type: 'number',
          default: 10000,
          description: 'Timeout for NFC read operations in milliseconds',
        },
        {
          displayName: 'Retry Attempts',
          name: 'retryAttempts',
          type: 'number',
          default: 3,
          description: 'Number of retry attempts for NFC operations',
        },
        {
          displayName: 'Use Sound Feedback',
          name: 'useSoundFeedback',
          type: 'boolean',
          default: true,
          description: 'Whether to use sound feedback for NFC operations',
        },
      ],
      description: 'NFC reader configuration settings',
    },
    {
      displayName: 'Backup Card IDs',
      name: 'backupCardIds',
      type: 'string',
      default: '',
      description: 'Comma-separated list of backup card IDs (for Wallet 2.0/3)',
      placeholder: 'CB12 3456 7890 ABCE, CB12 3456 7890 ABCF',
      displayOptions: {
        show: {
          cardType: ['wallet2', 'wallet3'],
        },
      },
    },
    {
      displayName: 'Access Code',
      name: 'accessCode',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The access code (PIN) for the card if set',
    },
    {
      displayName: 'Passcode',
      name: 'passcode',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The passcode for additional security if set',
    },
    {
      displayName: 'Note Currency',
      name: 'noteCurrency',
      type: 'options',
      options: [
        { name: 'Bitcoin (BTC)', value: 'BTC' },
        { name: 'Ethereum (ETH)', value: 'ETH' },
        { name: 'Solana (SOL)', value: 'SOL' },
        { name: 'XRP (XRP)', value: 'XRP' },
        { name: 'Cardano (ADA)', value: 'ADA' },
        { name: 'Dogecoin (DOGE)', value: 'DOGE' },
        { name: 'Litecoin (LTC)', value: 'LTC' },
      ],
      default: 'BTC',
      description: 'The currency for Tangem Note cards',
      displayOptions: {
        show: {
          cardType: ['note'],
        },
      },
    },
  ];

  // Note: Tangem cards cannot be tested via API as they require NFC interaction
  // This test verifies the format of provided credentials
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.tangem.com',
      url: '/v1/health',
      method: 'GET',
      skipSslCertificateValidation: false,
    },
  };
}
