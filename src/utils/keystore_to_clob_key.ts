#!/usr/bin/env node

import * as fs from 'fs';
import inquirer from 'inquirer';
import { ethers } from 'ethers';

// Define a type for the keystore object (basic structure)
interface KeyStore {
  // Add specific fields if needed, but for now, any
  [key: string]: any;
}

// Function to load private key from keystore
export async function loadPrivateKeyFromKeyStore(keystorePath: string, password?: string): Promise<string> {
  try {
    // Read keystore file
    const keystoreData: string = fs.readFileSync(keystorePath, 'utf8');
    const keystore: KeyStore = JSON.parse(keystoreData);

    // Get password interactively if not provided
    if (!password) {
      password = await promptPassword('Enter keystore password: ');
    }

    // Decrypt using ethers
    const wallet = await ethers.Wallet.fromEncryptedJson(keystoreData, password);

    // Print the address (safe)
    console.log('Decrypted keystore belongs to address:', wallet.address);

    // Return private key hex
    return wallet.privateKey;
  } catch (error) {
    throw new Error(`Failed to decrypt keystore: ${(error as Error).message}`);
  }
}

// Helper function to prompt for password using inquirer
async function promptPassword(question: string): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: question,
      mask: '*', // Display asterisks
    },
  ]);
  return answers.password;
}

// Example usage (commented out for ES module)
// Uncomment and adapt if running directly
/*
if (import.meta.url === `file://${process.argv[1]}`) {
  // ES module equivalent
}
*/
