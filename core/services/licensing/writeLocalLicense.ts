import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getUserDataPath } from "../storage/appPaths";
import type { SignedLicense } from "./licenseTypes";

const LICENSE_FILE = "license.json";

export function writeLocalLicense(license: SignedLicense): void {
  const directory = getUserDataPath();
  const filePath = path.join(directory, LICENSE_FILE);
  const temporaryPath = path.join(directory, `license-${randomUUID()}.tmp`);

  fs.mkdirSync(directory, { recursive: true });

  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(license, null, 2), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });

    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}
