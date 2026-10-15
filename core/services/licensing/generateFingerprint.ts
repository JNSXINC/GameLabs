import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const REGISTRY_PATH = "HKLM\\SOFTWARE\\Microsoft\\Cryptography";

export function generateFingerprint(): string {
  if (process.platform !== "win32") {
    throw new Error(
      "A identificação de dispositivo está disponível apenas no Windows.",
    );
  }

  const output = execFileSync(
    "reg.exe",
    ["query", REGISTRY_PATH, "/v", "MachineGuid"],
    {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
    },
  );

  const match = output.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);

  const machineGuid = match?.[1]?.trim();

  if (!machineGuid) {
    throw new Error("Não foi possível identificar este computador.");
  }

  return createHash("sha256")
    .update(`gamelabs-device-v1:${machineGuid}`)
    .digest("hex")
    .toUpperCase();
}
