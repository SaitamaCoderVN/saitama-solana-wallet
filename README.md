# Saitama Solana Wallet

Saitama Solana Wallet is a Command Line Interface (CLI) wallet for the Solana blockchain, providing essential functions to interact with the Solana network.

## Installation

To install Saitama Solana Wallet globally using npm, run:

```sh
npm install -g ss-wallet
```

## Key Features

- Create and manage multiple Solana wallets
- Request SOL airdrops (on testnet and devnet)
- Check wallet balances
- Send SOL transactions
- Import wallets from files
- View recent wallet activity
- Check current SOL price

## Commands
<!-- commands -->
* [`ss-wallet airdrop`](#ss-wallet-airdrop)
* [`ss-wallet balance`](#ss-wallet-balance)
* [`ss-wallet generate`](#ss-wallet-generate)
* [`ss-wallet help [COMMAND]`](#ss-wallet-help-command)
* [`ss-wallet list`](#ss-wallet-list)
* [`ss-wallet select`](#ss-wallet-select)
* [`ss-wallet send`](#ss-wallet-send)
* [`ss-wallet recent-activity`](#ss-wallet-recent-activity)
* [`ss-wallet sol-price`](#ss-wallet-sol-price)
* [`ss-wallet set-config`](#ss-wallet-set-config)
* [`ss-wallet show-private-key`](#ss-wallet-show-private-key)
* [`ss-wallet show`](#ss-wallet-show)
* [`ss-wallet remove`](#ss-wallet-remove)

## Usage

### Generate a New Wallet

```sh
ss-wallet generate
```
Output:
```
Keypair generated and saved to wallet.json
Public Key: 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
Private Key: a1b2c3d4...
Mnemonic Phrase (24 words):
word1 word2 word3 ... word24
```

or

```sh
ss-wallet generate [filename]
```

Output:
```
Keypair generated and saved to [filename].json
Public Key: 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
Private Key: a1b2c3d4...
Mnemonic Phrase (24 words):
word1 word2 word3 ... word24
```

### Request SOL Airdrop

```sh
ss-wallet airdrop <publicKey>
```

Output:
```
Airdrop requested for <publicKey>
```

### Check Balance

```sh
ss-wallet balance <publicKey>
```

Output:
```
Balance for <publicKey>: <balance> SOL
```

### Send Transaction

```sh
ss-wallet send <senderWallet> <recipientAddress> <amount>
```

Output:
```
Transaction successful with signature: <signature>
```

### Import Wallet

```sh
ss-wallet import <filepath>
```

Output:
```
Keypair loaded from <filepath>
Public Key: <publicKey>
```

### List Wallets

```sh
ss-wallet list
```

Output:
```
Wallets:
- <walletName1>
- <walletName2>
- <walletName3>
```

### Select Primary Wallet

```sh
ss-wallet select <walletName>
```

Output:
```
Primary wallet set to <walletName>
```

### Configure Network

```sh
ss-wallet set-config <networkName>
```

Output:
```
Network configuration set to <networkName>
```

### View Private Key

```sh
ss-wallet show-private-key
```

Output:
```
Private Key: <privateKey>
```

### Rename Wallet

```sh
ss-wallet rename <oldName> <newName>
```

Output:
```
Wallet renamed from <oldName> to <newName>
```

### View Recent Activity

```sh
ss-wallet recent-activity
```

Output:
```
Recent activity for <publicKey>:
- <Last Most Recent Activity 1>
- <Last Most Recent Activity 2>
- <Last Most Recent Activity 3>
```

### Check SOL Price

```sh
ss-wallet sol-price
```

Output:
```
Current SOL price: <price>
```

### Display Wallet Information

```sh
ss-wallet show
```

Output:
```
Wallet information:
- Name: <wallet-name.json>
- Path: <wallet-path>
- Public Key: <wallet-public-key>
- Balance: <wallet-balance>
- Network: <Solana Network>
- Current SOL price: <Solana Price>
- Value of the wallet: <Solana Value>
```

### Remove Wallet

```sh
ss-wallet remove <walletName>
```

Output:
```
Wallet removed: <walletName>
```
### Help
```sh
ss-wallet help
```

Output:
```
Usage: ss-wallet <command> [options]

Commands:
- generate: Generate a new wallet
- airdrop: Request a SOL airdrop
- balance: Check wallet balance
- send: Send a SOL transaction
- import: Import a wallet from a file
- list: List all wallets
- select: Select a primary wallet
- set-config: Configure network
- show-private-key: Display private key
- rename: Rename a wallet
- recent-activity: View recent activity
- sol-price: Check SOL price
- show: Display wallet information
- remove: Remove a wallet
- help: Display help information
```
## Examples

### Generate a New Wallet

```sh
ss-wallet generate my-wallet
```

Output:
```
Keypair generated and saved to my-wallet.json
Public Key: 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
Private Key: a1b2c3d4...
Mnemonic Phrase (24 words):
word1 word2 word3 ... word24
```

### Request Airdrop

```sh
ss-wallet airdrop 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
```

Output:
```
Airdrop requested for 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
```

### Check Balance

```sh
ss-wallet balance 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
```

Output:
```
Balance for 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc: 1 SOL
```

### Send Transaction

```sh
ss-wallet send my-wallet 62x7R9JCfVgxZgwKq4FbW6aoKHjPdScvG8HXD5eiz2Wr 0.1
```

Output:
```
Transaction successful with signature: 59dtaC8TGXrszRiW9WoqGAmq1zhhDMWHnVKq4PBqUHGXrDsD5p2M8HperktcBHfeKd6THMw4yCzxDeiQfRegTse6
```

## License

This project is licensed under the ISC License.