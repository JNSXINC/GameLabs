import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";

type RevocationRecord = {
  licenseId: string;
  revokedAt: string;
};

function getRevocationPath(): string {
  return path.join(
    app.getPath("userData"),
    "data",
    "user",
    "license-revocation.json",
  );
}

export function isLicenseRevokedLocally(licenseId: string): boolean {
  try {
    const filePath = getRevocationPath();

    if (!fs.existsSync(filePath)) {
      return false;
    }

    const content = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as RevocationRecord;

    return content.licenseId === licenseId;
  } catch (error) {
    console.error("[GameLabs] Erro ao ler revogação:", error);

    // Não permitir acesso se o registro de revogação estiver corrompido.
    return true;
  }
}

export function saveLicenseRevocation(licenseId: string): void {
  const filePath = getRevocationPath();

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const record: RevocationRecord = {
    licenseId,
    revokedAt: new Date().toISOString(),
  };

  const temporaryPath = `${filePath}.tmp`;

  fs.writeFileSync(temporaryPath, JSON.stringify(record, null, 2), "utf8");

  fs.renameSync(temporaryPath, filePath);
}

export function clearLicenseRevocation(licenseId: string): void {
  const filePath = getRevocationPath();

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  ) as RevocationRecord;

  // Nunca remover a revogação de outra licença.
  if (content.licenseId !== licenseId) {
    return;
  }

  fs.unlinkSync(filePath);

  console.log("[GameLabs] Revogação local removida após autorização online.");
}
