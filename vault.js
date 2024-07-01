import fs from 'fs';
import createVault from 'node-vault';

const VAULT_ENDPOINT = process.env.VAULT_ENDPOINT || 'https://127.0.0.1:8200';
let VAULT_TOKEN = process.env.VAULT_TOKEN;
if (process.env.VAULT_TOKEN_FILE) {
  VAULT_TOKEN = fs.readFileSync(process.env.VAULT_TOKEN_FILE).toString();
}

const vault = createVault({
  endpoint: VAULT_ENDPOINT,
  token: VAULT_TOKEN,
});

const secrets = new Map();

export function clearSecrets() {
  secrets.clear();
}

export async function getSecret(secret) {
  if (secrets.has(secret)) {
    return secrets.get(secret);
  }

  const response = await vault.read(secret);
  secrets.set(secret, response.data.data);

  return response.data.data;
}