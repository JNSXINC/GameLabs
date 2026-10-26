export type LicenseType = "trial" | "monthly" | "lifetime";

export type LicensePayload = {
  schemaVersion: 1;
  licenseId: string;
  type: LicenseType;
  deviceFingerprint: string;
  issuedAt: string;
  expiresAt: string | null;
};

export type SignedLicense = {
  payload: LicensePayload;
  signature: string;
};

export type LicenseValidationResult =
  | {
      valid: true;
      license: LicensePayload;
    }
  | {
      valid: false;
      reason:
        | "INVALID_FORMAT"
        | "INVALID_SIGNATURE"
        | "DEVICE_MISMATCH"
        | "EXPIRED"
        | "CLOCK_VERIFICATION_REQUIRED";
    };
