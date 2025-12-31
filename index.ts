/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * n8n-nodes-tangem
 *
 * A comprehensive n8n community node for Tangem NFC card wallet integration.
 * Provides multi-chain cryptocurrency signing, card management, and hardware
 * wallet workflows for Tangem Wallet 2.0/3, Tangem Note, and Tangem Ring.
 */

// Credentials
export * from './credentials/TangemCard.credentials';
export * from './credentials/TangemApp.credentials';
export * from './credentials/TangemNetwork.credentials';

// Nodes
export * from './nodes/Tangem/Tangem.node';
export * from './nodes/Tangem/TangemTrigger.node';

// Display licensing notice at module load (once per process)
const licenseNoticeDisplayed = Symbol.for('n8n-nodes-tangem-license-notice');

if (!(global as Record<symbol, boolean>)[licenseNoticeDisplayed]) {
  console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
  (global as Record<symbol, boolean>)[licenseNoticeDisplayed] = true;
}
