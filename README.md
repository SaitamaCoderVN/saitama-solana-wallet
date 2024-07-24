# Saitama Solana Wallet

A CLI wallet for Solana.

## Installation
To install the Saitama Solana Wallet globally using npm, run:
```sh
npm install -g saitama-solana-wallet
```

## Usage
### Generate a Keypair
To generate a new keypair and save it to a file:
```sh
ss-wallet generate mykeypair.json
```

### Airdrop SOL
To request an airdrop of SOL to a specified public key:
```sh
ss-wallet airdrop <publicKey>
```

### Check Balance
To check the balance of a specified public key:
```sh
ss-wallet balance <publicKey>
```

### Send a Transaction
To send a transaction from your keypair to a recipient's public key:
```sh
ss-wallet send mykeypair.json <recipientPublicKey> <amount>
```

### Import a Keypair
To import an existing keypair from a file:
```sh
ss-wallet import mykeypair.json
```

## Commands

- `generate <filepath>`: Generate a new keypair and save to a file.
- `airdrop <publicKey>`: Request an airdrop of SOL to the specified public key.
- `balance <publicKey>`: Check the balance of the specified public key.
- `send <keypairFile> <recipientPublicKey> <amount>`: Send a specified amount of SOL to a recipient.
- `import <filepath>`: Import an existing keypair from a file.

## Examples

### Generate a Keypair
```sh
ss-wallet generate mykeypair.json
```
Output:
```
Keypair generated and saved to mykeypair.json
Public Key: 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
```
    
### Airdrop SOL
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

### Send a Transaction
```sh
ss-wallet send mykeypair.json 62x7R9JCfVgxZgwKq4FbW6aoKHjPdScvG8HXD5eiz2Wr 0.1
```
Output:
```
Transaction successful with signature: 59dtaC8TGXrszRiW9WoqGAmq1zhhDMWHnVKq4PBqUHGXrDsD5p2M8HperktcBHfeKd6THMw4yCzxDeiQfRegTse6
```

### Import a Keypair
```sh
ss-wallet import mykeypair.json
```
Output:
```
Keypair loaded from mykeypair.json
Public Key: 5aj3BoJSsVcgGJg59EvYGZWutu3tvo977SLnDhzdtesc
```

## License

This project is licensed under the ISC License.