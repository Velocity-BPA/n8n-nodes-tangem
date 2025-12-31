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
 * Tangem App Credentials
 *
 * Credentials for integrating with the Tangem mobile application.
 * Used for portfolio sync and app-based operations.
 */
export class TangemApp implements ICredentialType {
  name = 'tangemApp';
  displayName = 'Tangem App';
  documentationUrl = 'https://docs.tangem.com/';
  properties: INodeProperties[] = [
    {
      displayName: 'Authorization Method',
      name: 'authMethod',
      type: 'options',
      options: [
        {
          name: 'Device Binding',
          value: 'deviceBinding',
          description: 'Use device-bound authorization',
        },
        {
          name: 'API Token',
          value: 'apiToken',
          description: 'Use API token for authentication',
        },
        {
          name: 'OAuth 2.0',
          value: 'oauth2',
          description: 'Use OAuth 2.0 for authentication',
        },
      ],
      default: 'deviceBinding',
      description: 'The method used to authenticate with Tangem App',
    },
    {
      displayName: 'Device ID',
      name: 'deviceId',
      type: 'string',
      default: '',
      description: 'The unique identifier of the bound device',
      displayOptions: {
        show: {
          authMethod: ['deviceBinding'],
        },
      },
    },
    {
      displayName: 'Binding Token',
      name: 'bindingToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The token used for device binding verification',
      displayOptions: {
        show: {
          authMethod: ['deviceBinding'],
        },
      },
    },
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The API token for Tangem App API access',
      displayOptions: {
        show: {
          authMethod: ['apiToken'],
        },
      },
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      description: 'OAuth 2.0 Client ID',
      displayOptions: {
        show: {
          authMethod: ['oauth2'],
        },
      },
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'OAuth 2.0 Client Secret',
      displayOptions: {
        show: {
          authMethod: ['oauth2'],
        },
      },
    },
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'OAuth 2.0 Access Token',
      displayOptions: {
        show: {
          authMethod: ['oauth2'],
        },
      },
    },
    {
      displayName: 'Refresh Token',
      name: 'refreshToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'OAuth 2.0 Refresh Token',
      displayOptions: {
        show: {
          authMethod: ['oauth2'],
        },
      },
    },
    {
      displayName: 'App Settings',
      name: 'appSettings',
      type: 'collection',
      default: {},
      options: [
        {
          displayName: 'Sync Portfolio',
          name: 'syncPortfolio',
          type: 'boolean',
          default: true,
          description: 'Whether to sync portfolio data from the app',
        },
        {
          displayName: 'Sync Transactions',
          name: 'syncTransactions',
          type: 'boolean',
          default: true,
          description: 'Whether to sync transaction history from the app',
        },
        {
          displayName: 'Auto Refresh',
          name: 'autoRefresh',
          type: 'boolean',
          default: false,
          description: 'Whether to automatically refresh app data',
        },
        {
          displayName: 'Refresh Interval (Seconds)',
          name: 'refreshInterval',
          type: 'number',
          default: 300,
          description: 'Interval for auto-refresh in seconds',
        },
      ],
      description: 'Tangem App synchronization settings',
    },
  ];
}
