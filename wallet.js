#!/usr/bin/env node

import chalk from 'chalk';
import { Keypair, Connection, LAMPORTS_PER_SOL, clusterApiUrl, Transaction, SystemProgram, sendAndConfirmTransaction, PublicKey } from '@solana/web3.js';
import { program } from 'commander';
import fs from 'fs';

program.version('1.0.0');

const saveKeypair = (keypair, filepath) => {
  fs.writeFileSync(filepath, JSON.stringify(Array.from(keypair.secretKey)));
};

const loadKeypair = (filepath) => {
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(filepath)));
  return Keypair.fromSecretKey(secretKey);
};

program
  .command('generate')
  .description('Generate a new keypair and save to a file')
  .argument('<filepath>', 'Filepath to save the keypair')
  .action((filepath) => {
    try {
      const keypair = Keypair.generate();
      saveKeypair(keypair, filepath);
      console.log(chalk.green(`Keypair generated and saved to ${filepath}`));
      console.log(chalk.blue(`Public Key: ${keypair.publicKey.toBase58()}`));
    } catch (error) {
      console.error(chalk.red(`Error generating keypair: ${error.message}`));
    }
  });

program
  .command('airdrop')
  .description('Request an airdrop of SOL')
  .argument('<publicKey>', 'Public key to receive the airdrop')
  .action(async (publicKey) => {
    try {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const signature = await connection.requestAirdrop(new PublicKey(publicKey), LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      console.log(chalk.green(`Airdrop requested for ${publicKey}`));
    } catch (error) {
      console.error(chalk.red(`Error requesting airdrop: ${error.message}`));
    }
  });

program
  .command('send')
  .description('Send SOL from one account to another')
  .argument('<keypairFile>', 'Filepath of the sender keypair')
  .argument('<recipient>', 'Recipient public key')
  .argument('<amount>', 'Amount of SOL to send')
  .action(async (keypairFile, recipient, amount) => {
    try {
      const senderKeypair = loadKeypair(keypairFile);
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        })
      );

      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
      console.log(chalk.green(`Transaction successful with signature: ${signature}`));
    } catch (error) {
      console.error(chalk.red(`Error sending SOL: ${error.message}`));
    }
  });

program
  .command('balance')
  .description('Check the balance of a public key')
  .argument('<publicKey>', 'Public key to check the balance of')
  .action(async (publicKey) => {
    try {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const balance = await connection.getBalance(new PublicKey(publicKey));
      console.log(chalk.green(`Balance for ${publicKey}: ${balance / LAMPORTS_PER_SOL} SOL`));
    } catch (error) {
      console.error(chalk.red(`Error checking balance: ${error.message}`));
    }
  });

program
  .command('import')
  .description('Import an existing keypair from a file')
  .argument('<filepath>', 'Filepath of the keypair to import')
  .action((filepath) => {
    try {
      const keypair = loadKeypair(filepath);
      console.log(chalk.green(`Keypair loaded from ${filepath}`));
      console.log(chalk.blue(`Public Key: ${keypair.publicKey.toBase58()}`));
    } catch (error) {
      console.error(chalk.red(`Error loading keypair: ${error.message}`));
    }
  });

program.parse(process.argv);