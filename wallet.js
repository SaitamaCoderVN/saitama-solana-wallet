#!/usr/bin/env node

import chalk from 'chalk';
import { Keypair, Connection, LAMPORTS_PER_SOL, clusterApiUrl, Transaction, SystemProgram, sendAndConfirmTransaction, PublicKey } from '@solana/web3.js';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';
import axios from 'axios'; // Added this line
import * as bip39 from 'bip39';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_PATH = path.resolve(__dirname, 'config.json');
const WALLETS_DIR = path.resolve(__dirname, 'wallets');

if (!fs.existsSync(WALLETS_DIR)) {
  fs.mkdirSync(WALLETS_DIR);
}

const loadConfig = () => {
  if (fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (!Array.isArray(config.wallets)) {
      config.wallets = [];
    }
    return config;
  } else {
    return { wallets: [], network: 'devnet', selectedWallet: null };
  }
};

const saveConfig = (config) => {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

const config = loadConfig();

const saveKeypair = (keypair, filepath) => {
  fs.writeFileSync(filepath, JSON.stringify(Array.from(keypair.secretKey)));
};

const loadKeypair = (filepath) => {
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(filepath)));
  return Keypair.fromSecretKey(secretKey);
};

const generateWalletFilename = () => {
  let index = 0;
  let filename;
  do {
    filename = `wallet-${index}.json`;
    index++;
  } while (fs.existsSync(path.join(WALLETS_DIR, filename)));
  return filename;
};

const closeReadline = () => {
  if (rl && !rl.closed) {
    rl.close();
  }
};

const getRecentTransactions = async (publicKey, connection) => {
  const signatures = await connection.getSignaturesForAddress(new PublicKey(publicKey), { limit: 10 });
  const transactions = await Promise.all(
    signatures.map(async (sig) => {
      const tx = await connection.getTransaction(sig.signature);
      return {
        signature: sig.signature,
        blockTime: new Date(sig.blockTime * 1000).toLocaleString(),
        amount: tx.meta.postBalances[0] - tx.meta.preBalances[0],
      };
    })
  );
  return transactions;
};

const getCurrentSOLPrice = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    return response.data.solana.usd;
  } catch (error) {
    console.error(chalk.red(`Error getting SOL price: ${error.message}`));
    return null;
  }
};

program
  .name('ss-wallet')
  .description('A CLI wallet for Solana')
  .version('1.1.1');

program
  .command('generate')
  .description('Generate a new keypair and save to a file')
  .argument('[filename]', 'Filename to save the keypair')
  .action((filename) => {
    try {
      const keypair = Keypair.generate();
      if (!filename) {
        filename = generateWalletFilename();
      }

      // Thêm phần mở rộng .json nếu chưa có
      filename = filename.endsWith('.json') ? filename : `${filename}.json`;
        
      // Kiểm tra xem tên ví đã tồn tại chưa
      if (config.wallets.some(w => w.name === filename)) {
        console.log(chalk.red(`Lỗi: Ví có tên "${filename}" đã tồn tại. Vui lòng chọn tên khác.`));
        closeReadline();
        return;
      };
      

      const filepath = path.join(WALLETS_DIR, filename);
      saveKeypair(keypair, filepath);
      config.wallets.push({ name: filename, path: filepath });
      saveConfig(config);
      console.log(chalk.green(`Keypair generated and saved to ${filepath}`));
      console.log(chalk.blue(`Public Key: ${keypair.publicKey.toBase58()}`));
      console.log(chalk.blue(`Private Key: ${Buffer.from(keypair.secretKey).toString('hex')}`));
      
      // Create and display a mnemonic phrase
      const mnemonic = generateMnemonic(keypair.secretKey);
      console.log(chalk.blue(`Mnemonic Phrase (24 words):`));
      console.log(chalk.blue(mnemonic));
      
      console.log(chalk.green(`Please save your Mnemonic Phrase securely for wallet recovery.`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error generating keypair: ${error.message}`));
      closeReadline();
    }
  });

// Function to generate a mnemonic phrase
function generateMnemonic(secretKey) {
  const entropy = Buffer.from(secretKey.slice(0, 32));
  return bip39.entropyToMnemonic(entropy);
}

program
  .command('airdrop')
  .description('Request an airdrop of SOL')
  .argument('<publicKey>', 'Public key to receive the airdrop')
  .action(async (publicKey) => {
    try {
      const connection = new Connection(clusterApiUrl(config.network), 'confirmed');
      const signature = await connection.requestAirdrop(new PublicKey(publicKey), LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      console.log(chalk.green(`Airdrop requested for ${publicKey}`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error requesting airdrop: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('send')
  .description('Send SOL from one account to another')
  .argument('<walletName>', 'Name of the sender wallet')
  .argument('<recipient>', 'Recipient public key')
  .argument('<amount>', 'Amount of SOL to send')
  .action(async (walletName, recipient, amount) => {
    try {
      const walletNameWithExt = walletName.endsWith('.json') ? walletName : `${walletName}.json`;

      const wallet = config.wallets.find(w => {
        if (typeof w === 'string') {
          return w === walletNameWithExt;
        }
        return (w && w.name === walletNameWithExt) || (w && w.path && path.basename(w.path) === walletNameWithExt);
      });
      
      const senderKeypair = loadKeypair(wallet.path);
      const connection = new Connection(clusterApiUrl(config.network), 'confirmed');
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        })
      );

      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
      console.log(chalk.green(`Transaction successful with signature: ${signature}`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error sending SOL: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('balance')
  .description('Check the balance of a public key')
  .argument('<publicKey>', 'Public key to check the balance of')
  .action(async (publicKey) => {
    try {
      const connection = new Connection(clusterApiUrl(config.network), 'confirmed');
      const balance = await connection.getBalance(new PublicKey(publicKey));
      console.log(chalk.green(`Balance for ${publicKey}: ${balance / LAMPORTS_PER_SOL} SOL`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error checking balance: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('import')
  .description('Import an existing keypair from a file')
  .argument('<filepath>', 'File path of the keypair to import')
  .action((filepath) => {
    try {
      // Add .json if not present
      const filepathWithExt = filepath.endsWith('.json') ? filepath : `${filepath}.json`;
      
      // Check if the file exists
      if (!fs.existsSync(filepathWithExt)) {
        console.log(chalk.red(`File not found: ${filepathWithExt}`));
        return;
      }

      const keypair = loadKeypair(filepathWithExt);
      const filename = path.basename(filepathWithExt);
      
      const checkAndRenameWallet = (name) => {
        const existingWallet = config.wallets.find(w => w.name === name);
        if (existingWallet) {
          rl.question(chalk.yellow(`A wallet named "${name}" already exists. Please enter a new name: `), (newName) => {
            if (newName.trim() === '') {
              console.log(chalk.red('Wallet name cannot be empty.'));
              checkAndRenameWallet(name);
            } else {
              checkAndRenameWallet(newName.endsWith('.json') ? newName : `${newName}.json`);
            }
          });
        } else {
          const newFilepath = path.join(WALLETS_DIR, name);
          fs.copyFileSync(filepathWithExt, newFilepath);
          config.wallets.push({ name: name, path: newFilepath });
          saveConfig(config);
          console.log(chalk.green(`Keypair imported from ${filepathWithExt} and saved as ${name}`));
          console.log(chalk.blue(`Public Key: ${keypair.publicKey.toBase58()}`));
          closeReadline();
        }
      };

      checkAndRenameWallet(filename);
    } catch (error) {
      console.error(chalk.red(`Error importing keypair: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('list')
  .description('List all created/imported wallets')
  .action(() => {
    try {
      const validWallets = config.wallets.filter(wallet => wallet && wallet.path);
      if (validWallets.length === 0) {
        console.log(chalk.yellow('No wallets found.'));
        closeReadline();
        return;
      }
      console.log(chalk.green('Wallet list:'));
      validWallets.forEach((wallet, index) => {
        try {
          const keypair = loadKeypair(wallet.path);
          const publicKey = keypair.publicKey.toBase58();
          console.log(`${index + 1}. ${wallet.name} (Public Key: ${publicKey})`);
          closeReadline();
        } catch (error) {
          // Skip invalid wallets
          console.log(chalk.red(`Error loading wallet: ${error.message}`));
          closeReadline();
        }
      });
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error listing wallets: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('select')
  .description('Select a wallet as the primary wallet')
  .argument('<name>', 'Name of the wallet to select')
  .action((name) => {
    try {
      // Add .json if not present
      const nameWithExt = name.endsWith('.json') ? name : `${name}.json`;

      const wallet = config.wallets.find(w => {
        if (typeof w === 'string') {
          return w === nameWithExt;
        }
        return (w && w.name === nameWithExt) || (w && w.path && path.basename(w.path) === nameWithExt);
      });

      if (!wallet) {
        console.log(chalk.red('Wallet not found with the given name.'));
        closeReadline();
        return;
      }

      if (typeof wallet === 'string') {
        config.selectedWallet = wallet;
      } else if (wallet && wallet.name) {
        config.selectedWallet = wallet.name;
      } else {
        console.log(chalk.red('Wallet does not have a valid name.'));
        closeReadline();
        return;
      }

      saveConfig(config);
      console.log(chalk.green(`Selected wallet ${config.selectedWallet}`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error selecting wallet: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('set-config')
  .description('Set the network configuration (devnet, mainnet-beta, testnet)')
  .argument('<network>', 'Network to set (devnet, mainnet-beta, testnet)')
  .action((network) => {
    try {
      const validNetworks = ['devnet', 'mainnet', 'testnet'];
      if (!validNetworks.includes(network)) {
        console.log(chalk.red('Invalid network. Valid options are: devnet, mainnet, testnet.'));
        closeReadline();
        return;
      }
      config.network = network;
      saveConfig(config);
      console.log(chalk.green(`Network set to ${network}`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error setting network: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('show-private-key')
  .description('Display the private key of the selected wallet')
  .action(() => {
    try {
      if (!config.selectedWallet) {
        console.log(chalk.red('No wallet selected.'));
        return;
      }

      let walletPath;
      const selectedWallet = config.wallets.find(w => {
        if (typeof w === 'string') {
          return w === config.selectedWallet;
        }
        return w && w.name === config.selectedWallet;
      });

      if (typeof selectedWallet === 'string') {
        walletPath = path.join(WALLETS_DIR, selectedWallet);
      } else if (selectedWallet && selectedWallet.path) {
        walletPath = selectedWallet.path;
      } else {
        console.log(chalk.red('Valid wallet path not found.'));
        return;
      }

      const keypair = loadKeypair(walletPath);
      console.log(chalk.green(`Private Key: ${Buffer.from(keypair.secretKey).toString('hex')}`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error displaying private key: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('rename')
  .description('Rename an existing wallet')
  .argument('<currentName>', 'Current name of the wallet')
  .argument('<newName>', 'New name for the wallet')
  .action((currentName, newName) => {
    try {
      // Add .json if not present
      const currentNameWithExt = currentName.endsWith('.json') ? currentName : `${currentName}.json`;
      const newNameWithExt = newName.endsWith('.json') ? newName : `${newName}.json`;

      const wallet = config.wallets.find(w => 
        w.name === currentNameWithExt || 
        (w.path && path.basename(w.path) === currentNameWithExt)
      );

      if (!wallet) {
        console.log(chalk.red('Wallet not found.'));
        closeReadline();
        return;
      }

      if (!wallet.path) {
        console.log(chalk.red('Wallet does not have a valid path.'));
        closeReadline();
        return;
      }

      const oldPath = wallet.path;
      const newPath = path.join(path.dirname(oldPath), newNameWithExt);

      fs.renameSync(oldPath, newPath);
      wallet.name = newNameWithExt;
      wallet.path = newPath;
      saveConfig(config);

      console.log(chalk.green(`Renamed wallet from ${currentNameWithExt} to ${newNameWithExt}`));
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error renaming wallet: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('recent-activity')
  .description('Check recent activity of the selected wallet')
  .action(async () => {
    try {
      if (!config.selectedWallet) {
        console.log(chalk.red('No wallet selected.'));
        closeReadline();
        return;
      }

      const selectedWallet = config.wallets.find(w => w.name === config.selectedWallet);
      if (!selectedWallet) {
        console.log(chalk.red('Selected wallet not found.'));
        closeReadline();
        return;
      }

      const keypair = loadKeypair(selectedWallet.path);
      const connection = new Connection(clusterApiUrl(config.network), 'confirmed');
      const publicKey = keypair.publicKey.toBase58();

      console.log(chalk.blue(`Checking recent activity for wallet: ${publicKey}`));
      
      const recentTransactions = await getRecentTransactions(publicKey, connection);

      if (recentTransactions.length === 0) {
        console.log(chalk.yellow('No recent activity.'));
      } else {
        console.log(chalk.green('Recent transactions:'));
        recentTransactions.forEach((tx, index) => {
          console.log(chalk.cyan(`${index + 1}. Signature: ${tx.signature}`));
          console.log(chalk.cyan(`   Time: ${tx.blockTime}`));
          console.log(chalk.cyan(`   Amount: ${tx.amount / LAMPORTS_PER_SOL} SOL`));
          console.log('---');
        });
      }

      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error checking recent activity: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('sol-price')
  .description('View the current price of SOL')
  .action(async () => {
    try {
      const price = await getCurrentSOLPrice();
      if (price) {
        console.log(chalk.green(`Current price of SOL: $${price}`));
      }
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error viewing SOL price: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('show')
  .description('Display information of the selected wallet')
  .action(async () => {
    try {
      if (!config.selectedWallet) {
        console.log(chalk.red('No wallet selected.'));
        return;
      }

      const selectedWallet = config.wallets.find(w => w.name === config.selectedWallet);
      if (!selectedWallet) {
        console.log(chalk.red('Wallet not found.'));
        return;
      }

      const keypair = loadKeypair(selectedWallet.path);
      const publicKey = keypair.publicKey.toBase58();
      const connection = new Connection(clusterApiUrl(config.network), 'confirmed');
      const balance = await connection.getBalance(new PublicKey(publicKey));

      console.log(chalk.green('Wallet information:'));
      console.log(chalk.cyan(`Name: ${selectedWallet.name}`));
      console.log(chalk.cyan(`Path: ${selectedWallet.path}`));
      console.log(chalk.cyan(`Public Key: ${publicKey}`));
      console.log(chalk.cyan(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`));
      console.log(chalk.cyan(`Network: ${config.network}`));

      const price = await getCurrentSOLPrice();
      if (price) {
        console.log(chalk.cyan(`Current SOL price: $${price}`));
        console.log(chalk.cyan(`Value of the wallet: $${(balance / LAMPORTS_PER_SOL * price).toFixed(2)}`));
      }

      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error displaying wallet information: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('remove')
  .description('Remove a wallet from the list')
  .argument('<walletName>', 'Name of the wallet to remove')
  .action((walletName) => {
    try {
      // Add .json if not present
      const walletNameWithExt = walletName.endsWith('.json') ? walletName : `${walletName}.json`;

      const walletToRemove = config.wallets.find(w => w.name === walletNameWithExt);
      if (!walletToRemove) {
        console.log(chalk.red(`Wallet not found: ${walletNameWithExt}`));
        closeReadline();
        return;
      }

      const indexToRemove = config.wallets.indexOf(walletToRemove);
      if (indexToRemove !== -1) {
        
        const walletPath = path.join(WALLETS_DIR, walletNameWithExt);
        if (fs.existsSync(walletPath)) {
          fs.unlinkSync(walletPath);
          console.log(chalk.green(`Removed wallet file: ${walletPath}`));
        }

        config.wallets.splice(indexToRemove, 1);
        saveConfig(config);
        console.log(chalk.green(`Wallet ${walletNameWithExt} removed successfully.`));

        // If the removed wallet is the one being selected, reset selectedWallet
        if (config.selectedWallet === walletNameWithExt) {
          config.selectedWallet = null;
          saveConfig(config);
          console.log(chalk.yellow('Selected wallet removed. Please select another wallet.'));
        }
      } else {
        console.log(chalk.red(`Wallet ${walletNameWithExt} not found in the list.`));
      }
      closeReadline();
    } catch (error) {
      console.error(chalk.red(`Error removing wallet: ${error.message}`));
      closeReadline();
    }
  });

program
  .command('help')
  .description('Display help for ss-wallet')
  .action(() => {
    console.log(chalk.cyan('Saitama Solana Wallet - CLI Commands:'));
    console.log(chalk.yellow('\nUsage: ss-wallet [command] [options]'));
    console.log(chalk.yellow('\nCommands:'));
    console.log(chalk.green('  generate                   Generate a default keypair and save to a file'));
    console.log(chalk.green('  generate [filename]        Generate a new keypair and save to a file'));
    console.log(chalk.green('  airdrop <publicKey>        Request an airdrop of SOL'));
    console.log(chalk.green('  send <wallet> <to> <amount> Send SOL from one account to another'));
    console.log(chalk.green('  balance <publicKey>        Check the balance of a public key'));
    console.log(chalk.green('  import <filepath>          Import an existing keypair from a file'));
    console.log(chalk.green('  list                       List all created/imported wallets'));
    console.log(chalk.green('  select <name>              Select a wallet as the primary wallet'));
    console.log(chalk.green('  set-config <network>       Set the network configuration'));
    console.log(chalk.green('  show-private-key           Display the private key of the selected wallet'));
    console.log(chalk.green('  rename <old> <new>         Rename an existing wallet'));
    console.log(chalk.green('  recent-activity            Check recent activity of the selected wallet'));
    console.log(chalk.green('  sol-price                  View the current price of SOL'));
    console.log(chalk.green('  show                       Display information of the selected wallet'));
    console.log(chalk.green('  remove <walletName>        Remove a wallet from the list'));
    console.log(chalk.green('  help                       Display this help message'));
    console.log(chalk.yellow('\nFor more information on a specific command, type: ss-wallet [command] --help'));
    closeReadline();
  });

if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);