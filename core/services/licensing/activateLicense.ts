import { generateFingerprint } from "./generateFingerprint";
import { validateLicense } from "./validateLicense";
import { writeLocalLicense } from "./writeLocalLicense";
import { LICENSE_PUBLIC_KEY_PEM } from "./licensePublicKey";
import type { LicenseValidationResult } from "./licenseTypes";

export function validateLicenseForActivation(
  input: unknown,
): LicenseValidationResult {
  const fingerprint = generateFingerprint();

  return validateLicense(input, fingerprint, LICENSE_PUBLIC_KEY_PEM);
}

export function activateLicense(input: unknown): LicenseValidationResult {
  const result = validateLicenseForActivation(input);

  if (!result.valid) {
    return result;
  }

  writeLocalLicense({
    payload: result.license,
    signature: (input as { signature: string }).signature,
  });

  return result;
}
