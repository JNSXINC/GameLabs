const fs = require("node:fs");
const path = require("node:path");
const { createPrivateKey, randomUUID, sign } = require("node:crypto");

const {
  generateFingerprint,
} = require("../dist-electron/services/licensing/generateFingerprint.js");

const {
  serializeLicensePayload,
} = require("../dist-electron/services/licensing/licenseSerialization.js");

const {
  validateLicense,
} = require("../dist-electron/services/licensing/validateLicense.js");

const privateKeyPath = path.join(
  __dirname,
  "private-keys",
  "license-private.pem",
);

const publicKeyPath = path.join(
  __dirname,
  "private-keys",
  "license-public.pem",
);

const passphrase = process.env.GAMELABS_KEY_PASSPHRASE;

if (!passphrase) {
  throw new Error("Senha da chave privada não informada.");
}

const privateKey = createPrivateKey({
  key: fs.readFileSync(privateKeyPath),
  passphrase,
});

const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");

const fingerprint = generateFingerprint();

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

const validResult = validateLicense(license, fingerprint, publicKeyPem);

const modifiedLicense = {
  payload: {
    ...payload,
    licenseId: randomUUID(),
  },
  signature,
};

const modifiedResult = validateLicense(
  modifiedLicense,
  fingerprint,
  publicKeyPem,
);

console.log(
  "Licença original:",
  validResult.valid ? "VALIDA" : validResult.reason,
);

console.log(
  "Licença adulterada:",
  modifiedResult.valid ? "ACEITA INDEVIDAMENTE" : modifiedResult.reason,
);

if (
  !validResult.valid ||
  modifiedResult.valid ||
  modifiedResult.reason !== "INVALID_SIGNATURE"
) {
  process.exitCode = 1;
}
