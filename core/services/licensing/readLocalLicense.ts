import fs from "node:fs";
import path from "node:path";
import { getUserDataPath } from "../storage/appPaths";
import type { SignedLicense } from "./licenseTypes";

const LICENSE_FILE = "license.json";

export function readLocalLicense(): SignedLicense | null {
  const filePath = path.join(getUserDataPath(), LICENSE_FILE);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf8");

    return JSON.parse(content) as SignedLicense;
  } catch {
    return null;
  }
}
