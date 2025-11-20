import createClobClient from '../src/utils/createClobClient.js';

async function testClient() {
  try {
    console.log('Testing createClobClient...');
    const client = await createClobClient();
    console.log('ClobClient created successfully!');
    console.log('Client properties:', Object.keys(client) , Object.values(client));
  } catch (error) {
    console.error('Error creating ClobClient:', error.message || error.toString() || error);
  }
}

testClient();
