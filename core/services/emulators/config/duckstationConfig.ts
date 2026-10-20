import * as fs from "node:fs";
import * as path from "node:path";
import { app } from "electron";

import type { PerformanceProfile } from "../../settings/performanceProfiles";
import { updateIniValue } from "./iniUtils";
import { isEmulatorRunning } from "./emulatorProcess";

export function applyDuckStationConfig(
  profile: PerformanceProfile,
  executablePath?: string,
): boolean {
  if (
    isEmulatorRunning(["duckstation-qt-x64-ReleaseLTCG.exe", "duckstation.exe"])
  ) {
    console.warn("[DuckStation] Emulador em execução. Perfil não aplicado.");
    return false;
  }

  const configPath = findDuckStationConfig(executablePath);

  if (!configPath) {
    console.warn("[DuckStation] settings.ini não encontrado.");
    return false;
  }

  const backupPath = `${configPath}.gamelabs.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(configPath, backupPath, fs.constants.COPYFILE_EXCL);
  }

  const original = fs.readFileSync(configPath, "utf8");

  let updated = updateIniValue(
    original,
    "GPU",
    "ResolutionScale",
    String(profile.internalResolution),
  );

  updated = updateIniValue(
    updated,
    "GPU",
    "Multisamples",
    profile.antiAliasing ? "4" : "1",
  );

  if (updated !== original) {
    const temporaryPath = `${configPath}.gamelabs.tmp`;

    try {
      fs.writeFileSync(temporaryPath, updated, "utf8");
      fs.renameSync(temporaryPath, configPath);
    } finally {
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    }
  }

  console.log("[DuckStation] Configuração localizada:", configPath);

  return true;
}

function findDuckStationConfig(executablePath?: string): string | null {
  const candidates: string[] = [];

  if (executablePath) {
    const emulatorDirectory = path.dirname(executablePath);

    // Instalação portátil: dados armazenados junto ao executável.
    if (fs.existsSync(path.join(emulatorDirectory, "portable.txt"))) {
      candidates.push(
        path.join(emulatorDirectory, "settings.ini"),
        path.join(emulatorDirectory, "data", "settings.ini"),
      );
    }
  }

  // Instalação padrão do DuckStation no Windows.
  candidates.push(
    path.join(
      app.getPath("appData"),
      "..",
      "Local",
      "DuckStation",
      "settings.ini",
    ),
  );

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}
