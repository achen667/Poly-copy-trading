import { Wallet } from '@ethersproject/wallet';
import { ClobClient } from '@polymarket/clob-client';
import { SignatureType } from '@polymarket/order-utils';
import { loadPrivateKeyFromKeyStore } from './keystore_to_clob_key';
import 'dotenv/config';
import inquirer from 'inquirer';
// import { ENV } from '../config/env';

const PROXY_WALLET = process.env.PROXY_WALLET;
// const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CLOB_HTTP_URL = process.env.CLOB_HTTP_URL;
// const API_KEY = process.env.POLY_API_KEY

const createClobClient = async (): Promise<ClobClient> => {
    const chainId = 137;
    const host = CLOB_HTTP_URL as string;
    const keystorePath = process.env.KEYSTORE_PATH as string;
    const keystorePassword = process.env.KEYSTORE_PASSWORD;

    console.log('Loading keystore from:', keystorePath);

    // If password is not set or is placeholder, prompt user to type it
    let passwordToUse = keystorePassword;
    if (!keystorePassword || keystorePassword === "your-password-here") {
        const answers = await inquirer.prompt([
            {
                type: 'password',
                name: 'password',
                message: 'Enter keystore password: ',
                mask: '*',
            },
        ]);
        passwordToUse = answers.password;
    }

    console.log('Decrypting keystore...');
    const privateKey = await loadPrivateKeyFromKeyStore(keystorePath, passwordToUse);
    const wallet = new Wallet(privateKey  as string );
    console.log('Wallet created');
    console.log('Creating ClobClient...');
    let clobClient = new ClobClient(
        host,
        chainId,
        wallet ,
        undefined,
        SignatureType.POLY_GNOSIS_SAFE,
        PROXY_WALLET as string
    );
     
    let creds = await clobClient.deriveApiKey();
    if (creds.key) {
        console.log('API Key created', creds);
    } else {
        creds = await clobClient.deriveApiKey();
        console.log('API Key derived', creds);
    }
    clobClient = new ClobClient(
        host,
        chainId,
        wallet,
        creds,
        SignatureType.POLY_GNOSIS_SAFE,
        PROXY_WALLET as string
    );
    console.log('ClobClient created:',clobClient);
    return clobClient;
};

export default createClobClient;
