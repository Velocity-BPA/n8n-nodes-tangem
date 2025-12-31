# n8n-nodes-tangem

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Tangem NFC hardware wallet integration. Provides secure cryptocurrency signing, multi-chain support, card management, and HD wallet derivation for 50+ blockchains through Tangem's secure element technology.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Tangem](https://img.shields.io/badge/Tangem-SDK-green)

## Features

- **26 Resource Categories** with 200+ operations
- **Multi-Chain Support** for 50+ blockchains (EVM, Bitcoin, Solana, Cardano, and more)
- **Hardware Wallet Security** - private keys never leave the Tangem card
- **HD Wallet Derivation** - BIP-32/39/44/84/86 compliant key derivation
- **Multi-Card Backup** - support for Tangem Wallet 2.0/3 backup system
- **Transaction Signing** - EIP-1559, legacy, PSBT, and chain-specific formats
- **Message Signing** - personal messages, EIP-712 typed data
- **Card Management** - PIN, access codes, security settings
- **NFC Operations** - session management, timeout handling
- **Token Operations** - ERC-20, ERC-721, SPL tokens

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-tangem`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Clone or extract the package
git clone https://github.com/Velocity-BPA/n8n-nodes-tangem.git
cd n8n-nodes-tangem

# Install dependencies and build
npm install
npm run build

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-tangem.git
cd n8n-nodes-tangem

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-tangem

# Restart n8n
n8n start
```

## Credentials Setup

### Tangem Card Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Card Type | Tangem Wallet 2.0, Wallet 3, Note, Ring, Custom | Yes |
| Card ID (CID) | Unique card identifier (hex format) | No |
| NFC Timeout | Timeout for NFC operations (ms) | No |
| Retry Attempts | Number of retry attempts for failed operations | No |
| Wallet Public Key | Public key from wallet (for verification) | No |

### Tangem Network Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Network | Mainnet or Testnet | Yes |
| RPC Endpoint URL | Custom RPC endpoint | No |
| Block Explorer URL | Custom block explorer | No |
| Chain ID | EVM chain ID (for custom networks) | No |

### Tangem App Credentials

| Field | Description | Required |
|-------|-------------|----------|
| App Authorization | Authorization for Tangem app sync | No |
| Device Binding | Device binding identifier | No |

## Resources & Operations

### Card Operations (15 operations)
- Scan Card, Get Card Info, Get Card ID, Get Firmware Version
- Get Batch ID, Get Manufacturer, Get Card Status
- Get Settings Mask, Get Remaining Signatures, Get Health Status
- Check Card Authenticity, Get Attestation, Get Product Mask
- Is Card Activated, Get PIN Status

### Wallet Operations (11 operations)
- Create Wallet, Get Wallet, Get Wallet Public Key
- Get Wallet Addresses, Get Wallet Status, Purge Wallet
- Get Wallet Index, Get Wallet Curve, Get Wallet Settings
- Get HD Wallet Info, Derive Addresses

### Multi-Card Operations (10 operations)
- Get Card Set Info, Get Primary Card, Get Backup Cards
- Link Backup Card, Get Backup Status, Read Primary Card
- Read Backup Card, Check Set Integrity, Activate Card Set
- Get Set PIN Status

### Account Operations (10 operations)
- Get Accounts, Get Account by Chain, Get Account Address
- Get Account Balance, Get Account History, Add Account
- Remove Account, Get All Addresses, Sync Account
- Get Multi-Chain Balances

### Bitcoin Operations (10 operations)
- Get Bitcoin Address, Get Bitcoin Public Key, Sign Transaction
- Sign PSBT, Get UTXO, Create Transaction, Estimate Fee
- Broadcast Transaction, Sign Message, Verify Message

### Ethereum Operations (11 operations)
- Get Ethereum Address, Sign EIP-1559 Transaction
- Sign Legacy Transaction, Sign Message, Sign Personal Message
- Sign Typed Data (EIP-712), Get Balance, Get Token Balances
- Get Nonce, Estimate Gas, Broadcast Transaction

### EVM Chains Operations (6 operations)
Supports: Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Fantom, Gnosis, Cronos, Linea, Scroll, zkSync, Mantle, Blast, and more.
- Get Address, Sign Transaction, Sign Message
- Sign Typed Data, Get Balance, Broadcast Transaction

### Solana Operations (7 operations)
- Get Solana Address, Get Public Key, Sign Transaction
- Sign Message, Get Token Accounts, Get Balance
- Broadcast Transaction

### Additional Chain Resources
- **Cardano** (5 operations): Address, Transaction, Staking Key, Balance, Broadcast
- **XRP** (4 operations): Address, Transaction, Account Info, Broadcast
- **Stellar** (4 operations): Address, Transaction, Balance, Broadcast
- **Polkadot** (4 operations): Address, Extrinsic, Balance, Broadcast
- **Cosmos** (4 operations): Address, Transaction, Balance, Broadcast
- **Near** (4 operations): Address, Transaction, Balance, Broadcast
- **Tron** (4 operations): Address, Transaction, Balance, Broadcast

### Token Operations (8 operations)
- Get Token Balance, Get Token Info, Sign Token Transfer
- Sign Token Approval, Get NFTs, Sign NFT Transfer
- Get Supported Tokens, Add Custom Token

### Transaction Operations (8 operations)
- Create Transaction, Sign Transaction, Get Transaction Status
- Broadcast Transaction, Get Transaction Fee, Estimate Fee
- Get Transaction History, Verify Transaction

### Signing Operations (8 operations)
- Sign Hash, Sign Data, Sign Transaction, Sign Message
- Sign Typed Data, Get Signature, Verify Signature, Batch Sign

### HD Wallet Operations (7 operations)
- Get HD Wallet Info, Derive Key, Get Derived Address
- Get Child Public Key, Get Derivation Path
- Create HD Wallet, Get Extended Public Key

### Backup Operations (7 operations)
- Start Backup Process, Finalize Backup, Get Backup Status
- Read Backup Card, Write Backup Card, Verify Backup
- Get Backup Card Count

### PIN Operations (8 operations)
- Set Access Code, Change Access Code, Reset Access Code
- Get Access Code Status, Set Passcode, Change Passcode
- Reset Passcode, Is PIN Set

### Security Operations (8 operations)
- Get Card Attestation, Verify Authenticity, Get Security Delay
- Set Security Delay, Get Signing Methods, Get Settings Mask
- Check Tampering, Get Health Check

### NFC Operations (8 operations)
- Initialize NFC, Scan for Card, Read Card, Write to Card
- Get NFC Status, Set NFC Timeout, Cancel NFC Operation
- Get Reader Info

### Tangem App Operations (5 operations)
- Sync with App, Get App Portfolio, Get App Transactions
- Import from App, Export to App

### Firmware Operations (5 operations)
- Get Firmware Version, Check for Updates, Get Card Generation
- Get Batch Info, Get Capabilities

### Utility Operations (7 operations)
- Get Supported Curves, Get Supported Blockchains
- Validate Address, Get Derivation Path
- Convert Address Format, Get Card Limits, Test NFC Connection

## Trigger Node

The **Tangem Trigger** node monitors for various card and signing events:

### Event Categories

| Category | Events |
|----------|--------|
| NFC | Card Tapped, Card Read Complete, Card Write Complete, NFC Error |
| Signing | Sign Request, Signature Complete, Signing Cancelled |
| Transaction | Transaction Signed, Broadcast, Confirmed, Failed |
| Card | Card Activated, Wallet Created, Wallet Purged, PIN Changed, Backup Created |
| Security | Authentication Required, Access Code Required, Security Delay Active, Tampering Detected |

## Usage Examples

### Scan Card and Get Info

```javascript
// Workflow: Card Scanning
// 1. Add Tangem node
// 2. Select "Card" resource
// 3. Select "Scan Card" operation
// 4. Connect to your workflow

// Output includes:
// - cardId, firmwareVersion, manufacturerName
// - wallets array with public keys
// - settingsMask, isActivated, remainingSignatures
```

### Sign Ethereum Transaction

```javascript
// Workflow: Ethereum Transaction Signing
// 1. Add Tangem node with Ethereum resource
// 2. Configure transaction parameters:
{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab12",
  "value": "1000000000000000000", // 1 ETH in wei
  "gasLimit": "21000",
  "maxFeePerGas": "30000000000",
  "maxPriorityFeePerGas": "1000000000",
  "chainId": 1
}
// 3. Card tap required for signing
// 4. Returns signed transaction ready for broadcast
```

### Multi-Chain Address Derivation

```javascript
// Workflow: Get addresses for multiple chains
// Use Tangem node with Account resource
// Operation: Get All Addresses

// Returns addresses for:
// - Ethereum: 0x...
// - Bitcoin: bc1...
// - Solana: ...
// - And configured chains
```

### Message Signing (EIP-712)

```javascript
// Sign typed data for DeFi protocols
// Resource: Ethereum
// Operation: Sign Typed Data

{
  "domain": {
    "name": "My DApp",
    "version": "1",
    "chainId": 1,
    "verifyingContract": "0x..."
  },
  "types": {
    "Permit": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" },
      { "name": "value", "type": "uint256" }
    ]
  },
  "message": {
    "owner": "0x...",
    "spender": "0x...",
    "value": "1000000000000000000"
  }
}
```

### Backup Card Setup

```javascript
// Workflow: Initialize Backup Cards
// 1. Scan primary card
// 2. Use Multi-Card resource → Link Backup Card
// 3. Tap backup card when prompted
// 4. Verify backup with Check Set Integrity

// Supports up to 2 backup cards (Wallet 2.0/3)
```

## Tangem Concepts

### Tangem Card Types

| Type | Description | Wallets | Backup |
|------|-------------|---------|--------|
| Tangem Wallet 2.0 | Standard wallet (2-card set) | Multiple | Yes |
| Tangem Wallet 3 | Premium wallet (3-card set) | Multiple | Yes |
| Tangem Note | Single-currency card | 1 | No |
| Tangem Ring | Wearable NFC wallet | Multiple | Yes |
| Custom | Enterprise/branded cards | Varies | Varies |

### Security Model

- **Private keys never leave the card** - all signing happens on the secure element
- **Card attestation** - cryptographic proof of genuine Tangem hardware
- **Access codes** - PIN protection for card operations
- **Security delay** - configurable delay before signing (anti-theft)
- **Multi-card backup** - redundancy for key recovery

### Supported Elliptic Curves

| Curve | Usage | Blockchains |
|-------|-------|-------------|
| secp256k1 | ECDSA | Bitcoin, Ethereum, most EVM chains |
| ed25519 | EdDSA | Solana, Cardano, Stellar, Near |
| secp256r1 | ECDSA (NIST) | Some enterprise chains |
| bls12381 | BLS | Ethereum 2.0 staking |

## Supported Networks

### EVM Chains (Chain ID)

| Network | Chain ID | Symbol |
|---------|----------|--------|
| Ethereum | 1 | ETH |
| Polygon | 137 | MATIC |
| BNB Chain | 56 | BNB |
| Arbitrum One | 42161 | ETH |
| Optimism | 10 | ETH |
| Base | 8453 | ETH |
| Avalanche C-Chain | 43114 | AVAX |
| Fantom | 250 | FTM |
| Gnosis | 100 | xDAI |
| Cronos | 25 | CRO |
| zkSync Era | 324 | ETH |
| Linea | 59144 | ETH |
| Scroll | 534352 | ETH |
| Mantle | 5000 | MNT |
| Blast | 81457 | ETH |

### Non-EVM Chains

| Network | Curve | Address Format |
|---------|-------|----------------|
| Bitcoin | secp256k1 | bc1..., 1..., 3... |
| Solana | ed25519 | Base58 |
| Cardano | ed25519 | addr1... |
| XRP | secp256k1 | r... |
| Stellar | ed25519 | G... |
| Polkadot | sr25519/ed25519 | 1... |
| Cosmos | secp256k1 | cosmos1... |
| Near | ed25519 | .near |
| Tron | secp256k1 | T... |

## Error Handling

The node includes comprehensive error handling:

```javascript
// Enable "Continue On Fail" for graceful error handling
// Errors include:
{
  "success": false,
  "error": "Card not found - ensure card is tapped",
  "operation": "signTransaction",
  "code": "CARD_NOT_FOUND"
}

// Common error codes:
// CARD_NOT_FOUND - Card not detected by NFC
// TIMEOUT - Operation timed out
// PIN_REQUIRED - Access code needed
// BACKUP_REQUIRED - Backup card must be tapped
// INVALID_SIGNATURE - Signature verification failed
// UNSUPPORTED_CURVE - Card doesn't support requested curve
```

## Security Best Practices

1. **Always verify card attestation** before trusting signatures
2. **Use access codes** for production cards
3. **Set up backup cards** for critical wallets
4. **Enable security delay** for high-value operations
5. **Verify addresses** on multiple channels before signing
6. **Test on testnet** before mainnet transactions
7. **Store backup cards securely** in separate locations
8. **Audit signing operations** regularly

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)
- Email: licensing@velobpa.com

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run linting: `npm run lint`
5. Run tests: `npm test`
6. Commit changes: `git commit -am 'Add new feature'`
7. Push to branch: `git push origin feature/my-feature`
8. Submit a pull request

## Support

- **Documentation**: [GitHub Wiki](https://github.com/Velocity-BPA/n8n-nodes-tangem/wiki)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-tangem/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Velocity-BPA/n8n-nodes-tangem/discussions)
- **Commercial Support**: licensing@velobpa.com

## Acknowledgments

- [Tangem](https://tangem.com) for their hardware wallet technology and SDK
- [n8n](https://n8n.io) for the workflow automation platform
- The open-source cryptocurrency community

## Changelog

### v1.0.0 (Initial Release)
- 26 resource categories with 200+ operations
- Support for 50+ blockchains
- Multi-card backup system support
- HD wallet derivation
- Comprehensive trigger node
- Full documentation and examples
