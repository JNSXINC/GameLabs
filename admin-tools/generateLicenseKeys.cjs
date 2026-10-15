const { generateKeyPairSync } = require("node:crypto");

const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.join(__dirname, "private-keys");

fs.mkdirSync(outputDir, {
  recursive: true,
  mode: 0o700,
});

const privatePath = path.join(outputDir, "license-private.pem");

const publicPath = path.join(outputDir, "license-public.pem");

if (fs.existsSync(privatePath) || fs.existsSync(publicPath)) {
  throw new Error(
    "Já existem chaves. Operação cancelada para evitar sobrescrita.",
  );
}

const passphrase = process.env.GAMELABS_KEY_PASSPHRASE;

if (!passphrase || passphrase.length < 16) {
  throw new Error(
    "Defina GAMELABS_KEY_PASSPHRASE com pelo menos 16 caracteres.",
  );
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
    cipher: "aes-256-cbc",
    passphrase,
  },
});

fs.writeFileSync(privatePath, privateKey, {
  flag: "wx",
  mode: 0o600,
});

fs.writeFileSync(publicPath, publicKey, {
  flag: "wx",
});

console.log("Par de chaves Ed25519 gerado com sucesso.");
console.log("Chave privada protegida por senha.");
