import type { LicensePayload } from "./licenseTypes";

export function serializeLicensePayload(payload: LicensePayload): Buffer {
  return Buffer.from(
    JSON.stringify([
      payload.schemaVersion,
      payload.licenseId,
      payload.type,
      payload.deviceFingerprint,
      payload.issuedAt,
      payload.expiresAt,
    ]),
    "utf8",
  );
}
