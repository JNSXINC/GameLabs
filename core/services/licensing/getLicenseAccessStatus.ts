import { readLocalLicense } from "./readLocalLicense";
import { validateLicense } from "./validateLicense";
import { LICENSE_PUBLIC_KEY_PEM } from "./licensePublicKey";
import { generateFingerprint } from "./generateFingerprint";
import { checkOnlineLicense } from "./checkOnlineLicense";
import {
  isLicenseRevokedLocally,
  saveLicenseRevocation,
  clearLicenseRevocation,
} from "./licenseRevocation";
import type { LicenseValidationResult } from "./licenseTypes";

export type LicenseAccessResult =
  | LicenseValidationResult
  | {
      valid: false;
      reason:
        | "NO_LICENSE"
        | "LICENSE_REVOKED"
        | "LICENSE_EXPIRED"
        | "LICENSE_INACTIVE"
        | "LICENSE_SERVER_UNAVAILABLE"
        | "LICENSE_CHECK_FAILED";
    };

export async function getLicenseAccessStatus(): Promise<LicenseAccessResult> {
  try {
    const license = readLocalLicense();

    if (!license) {
      return { valid: false, reason: "NO_LICENSE" };
    }

    const validation = validateLicense(
      license,
      generateFingerprint(),
      LICENSE_PUBLIC_KEY_PEM,
    );

    if (!validation.valid) {
      return validation;
    }

    const licenseId = validation.license.licenseId;

    const onlineStatus = await checkOnlineLicense(licenseId, license.signature);

    if (onlineStatus === "REVOKED") {
      saveLicenseRevocation(licenseId);

      return {
        valid: false,
        reason: "LICENSE_REVOKED",
      };
    }

    if (onlineStatus === "ACTIVE" && isLicenseRevokedLocally(licenseId)) {
      clearLicenseRevocation(licenseId);
    }

    if (onlineStatus === "UNAVAILABLE" && isLicenseRevokedLocally(licenseId)) {
      return {
        valid: false,
        reason: "LICENSE_REVOKED",
      };
    }

    if (onlineStatus === "EXPIRED") {
      return {
        valid: false,
        reason: "LICENSE_EXPIRED",
      };
    }

    if (onlineStatus === "INACTIVE") {
      return {
        valid: false,
        reason: "LICENSE_INACTIVE",
      };
    }

    if (
      onlineStatus === "UNAVAILABLE" &&
      validation.license.type !== "lifetime"
    ) {
      return {
        valid: false,
        reason: "LICENSE_SERVER_UNAVAILABLE",
      };
    }

    return validation;
  } catch (error) {
    console.error("[GameLabs] Erro ao consultar licença:", error);

    return {
      valid: false,
      reason: "LICENSE_CHECK_FAILED",
    };
  }
}
