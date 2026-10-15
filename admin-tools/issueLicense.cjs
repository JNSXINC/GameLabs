const fs = require("node:fs");
const path = require("node:path");
const { createPrivateKey, randomUUID, sign } = require("node:crypto");

const {
  serializeLicensePayload,
} = require("../dist-electron/services/licensing/licenseSerialization.js");

const fingerprint = process.argv[2]?.trim().toUpperCase();
const passphrase = process.env.GAMELABS_KEY_PASSPHRASE;

if (!fingerprint || !/^[A-F0-9]{64}$/.test(fingerprint)) {
  throw new Error("Informe um fingerprint válido de 64 caracteres.");
}

if (!passphrase) {
  throw new Error("Senha da chave privada não informada.");
}

const privateKeyPath = path.join(
  __dirname,
  "private-keys",
  "license-private.pem",
);

const privateKey = createPrivateKey({
  key: fs.readFileSync(privateKeyPath),
  passphrase,
});

if (privateKey.asymmetricKeyType !== "ed25519") {
  throw new Error("A chave privada precisa ser Ed25519.");
}

const payload = {
  schemaVersion: 1,
  licenseId: randomUUID(),
  type: "lifetime",
  deviceFingerprint: fingerprint,
  issuedAt: new Date().toISOString(),
  expiresAt: null,
};

const signature = sign(
  null,
  serializeLicensePayload(payload),
  privateKey,
).toString("base64");

const license = { payload, signature };

console.log(JSON.stringify(license));
