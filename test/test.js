import { loadPrivateKeyFromKeyStore } from '../src/utils/keystore_to_clob_key.ts';

async function test() {
  try {
    const privateKey = await loadPrivateKeyFromKeyStore('keystore.json');
    console.log('Private key loaded successfully');
    // Don't print the key for security
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
