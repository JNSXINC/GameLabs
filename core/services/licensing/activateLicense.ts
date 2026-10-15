import { generateFingerprint } from "./generateFingerprint";
import { validateLicense } from "./validateLicense";
import { writeLocalLicense } from "./writeLocalLicense";
import { LICENSE_PUBLIC_KEY_PEM } from "./licensePublicKey";

import type { LicenseValidationResult } from "./licenseTypes";

export function activateLicense(input: unknown): LicenseValidationResult {
  const fingerprint = generateFingerprint();

  const result = validateLicense(input, fingerprint, LICENSE_PUBLIC_KEY_PEM);

  if (!result.valid) {
    return result;
  }

  writeLocalLicense({
    payload: result.license,
    signature: (input as { signature: string }).signature,
  });

  return result;
}
