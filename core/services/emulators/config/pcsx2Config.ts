import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type { PerformanceProfile } from "../../settings/performanceProfiles";
import { app } from "electron";
import { execFileSync } from "node:child_process";

function findPCSX2Config(executablePath?: string): string | null {
  const candidates: string[] = [];

  if (executablePath) {
    const emulatorDirectory = path.dirname(executablePath);

    // Instalações portáteis do PCSX2
    if (fs.existsSync(path.join(emulatorDirectory, "portable.ini"))) {
      candidates.push(path.join(emulatorDirectory, "inis", "PCSX2.ini"));
    }
  }

  // Instalação padrão do PCSX2 no Windows
  const documents = app.getPath("documents");

  candidates.push(path.join(documents, "PCSX2", "inis", "PCSX2.ini"));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export function updateIniValue(
  content: string,
  section: string,
  key: string,
  value: string,
): string {
  const lines = content.split(/\r?\n/);
  let currentSection = "";
  let sectionFound = false;
  let keyFound = false;

  const updated = lines.map((line) => {
    const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);

    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (currentSection === section) {
        sectionFound = true;
      }
      return line;
    }

    if (
      currentSection === section &&
      line.match(/^\s*([^=]+?)\s*=/)?.[1].trim() === key
    ) {
      keyFound = true;
      return `${key} = ${value}`;
    }

    return line;
  });

  if (!sectionFound) {
    return [...updated, "", `[${section}]`, `${key} = ${value}`].join("\r\n");
  }

  if (!keyFound) {
    const sectionIndex = updated.findIndex(
      (line) => line.trim() === `[${section}]`,
    );

    updated.splice(sectionIndex + 1, 0, `${key} = ${value}`);
  }

  return updated.join("\r\n");
}

function isPCSX2Running(): boolean {
  if (process.platform !== "win32") {
    return false;
  }

  try {
    const output = execFileSync("tasklist", ["/FO", "CSV", "/NH"], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 5000,
    });

    return output.split(/\r?\n/).some((line) => {
      const imageName = line.match(/^"([^"]+)"/)?.[1];

      return (
        imageName?.toLowerCase() === "pcsx2-qt.exe" ||
        imageName?.toLowerCase() === "pcsx2.exe"
      );
    });
  } catch (error) {
    console.error("[PCSX2] Falha ao verificar o processo:", error);

    throw new Error(
      "[PCSX2] Não foi possível verificar se o emulador está em execução.",
    );
  }
}

export function applyPCSX2Config(
  profile: PerformanceProfile,
  executablePath?: string,
): boolean {
  if (isPCSX2Running()) {
    console.warn("[PCSX2] Emulador em execução. Perfil não aplicado.");

    return false;
  }

  const configPath = findPCSX2Config(executablePath);

  if (!configPath) {
    console.warn("[PCSX2] Arquivo PCSX2.ini não encontrado.");
    return false;
  }

  const original = fs.readFileSync(configPath, "utf8");

  const backupPath = `${configPath}.gamelabs.bak`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(configPath, backupPath, fs.constants.COPYFILE_EXCL);
  }

  let updated = original;

  // Define português brasileiro como idioma padrão do PCSX2.
  updated = updateIniValue(updated, "UI", "Language", "pt-BR");

  updated = updateIniValue(
    updated,
    "EmuCore/GS",
    "upscale_multiplier",
    String(profile.internalResolution),
  );

  updated = updateIniValue(
    updated,
    "EmuCore/GS",
    "MaxAnisotropy",
    profile.anisotropicFiltering ? "8" : "0",
  );

  updated = updateIniValue(
    updated,
    "EmuCore/GS",
    "fxaa",
    profile.antiAliasing ? "true" : "false",
  );

  // Mantemos as demais opções gráficas, BIOS e controles intactos.
  // O antialiasing será tratado após validarmos a compatibilidade.

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

  console.log("[PCSX2] Perfil aplicado com sucesso:", configPath);
  return true;
}
