import { createPublicKey, verify } from "node:crypto";
import type {
  LicensePayload,
  LicenseValidationResult,
  SignedLicense,
} from "./licenseTypes";
import { serializeLicensePayload } from "./licenseSerialization";

function isLicensePayload(value: unknown): value is LicensePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    data.schemaVersion === 1 &&
    typeof data.licenseId === "string" &&
    data.licenseId.length > 0 &&
    (data.type === "trial" || data.type === "lifetime") &&
    typeof data.deviceFingerprint === "string" &&
    /^[A-F0-9]{64}$/.test(data.deviceFingerprint) &&
    typeof data.issuedAt === "string" &&
    !Number.isNaN(Date.parse(data.issuedAt)) &&
    (data.expiresAt === null ||
      (typeof data.expiresAt === "string" &&
        !Number.isNaN(Date.parse(data.expiresAt))))
  );
}

export function validateLicense(
  input: unknown,
  expectedFingerprint: string,
  publicKeyPem: string,
): LicenseValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  const candidate = input as Partial<SignedLicense>;

  if (
    !isLicensePayload(candidate.payload) ||
    typeof candidate.signature !== "string" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(candidate.signature)
  ) {
    return { valid: false, reason: "INVALID_FORMAT" };
  }

  const payload = candidate.payload;

  try {
    const publicKey = createPublicKey(publicKeyPem);

    if (publicKey.asymmetricKeyType !== "ed25519") {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }

    const signature = Buffer.from(candidate.signature, "base64");

    if (signature.length !== 64) {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }

    const authentic = verify(
      null,
      serializeLicensePayload(payload),
      publicKey,
      signature,
    );

    if (!authentic) {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }
  } catch {
    return { valid: false, reason: "INVALID_SIGNATURE" };
  }

  if (payload.deviceFingerprint !== expectedFingerprint) {
    return { valid: false, reason: "DEVICE_MISMATCH" };
  }

  if (payload.type === "lifetime") {
    if (payload.expiresAt !== null) {
      return { valid: false, reason: "INVALID_FORMAT" };
    }

    return { valid: true, license: payload };
  }

  if (payload.expiresAt === null) {
    return {
      valid: false,
      reason: "CLOCK_VERIFICATION_REQUIRED",
    };
  }

  // A Trial precisa de horário online confiável.
  // Não aprovamos uma Trial usando o relógio local.
  return {
    valid: false,
    reason: "CLOCK_VERIFICATION_REQUIRED",
  };
}
