import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import { readControllerSettings } from "./controllerSettings";

type InputDevice = "keyboard1" | "keyboard2" | "controller";

const PROFILE_NAMES: Record<InputDevice, string> = {
  keyboard1: "GameLabs-Teclado1",
  keyboard2: "GameLabs-Teclado2",
  controller: "GameLabs-Controle",
};

const INPUT_SECTIONS = ["Pad1"];

function getSection(content: string, section: string): string | null {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `[${section}]`);

  if (start === -1) return null;

  let end = start + 1;

  while (end < lines.length && !/^\s*\[.+\]\s*$/.test(lines[end])) {
    end++;
  }

  return lines
    .slice(start + 1, end)
    .join("\n")
    .trimEnd();
}

function replaceSection(
  content: string,
  section: string,
  replacement: string,
): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `[${section}]`);

  if (start === -1) {
    throw new Error(`Seção [${section}] não encontrada no PCSX2.ini.`);
  }

  let end = start + 1;

  while (end < lines.length && !/^\s*\[.+\]\s*$/.test(lines[end])) {
    end++;
  }

  lines.splice(start + 1, end - start - 1, ...replacement.split("\n"));

  return lines.join("\n");
}

export function applyPCSX2InputProfile(): string {
  const { inputDevice } = readControllerSettings();

  const profileName = PROFILE_NAMES[inputDevice];

  if (!profileName) {
    throw new Error(`Modo de entrada inválido: ${inputDevice}`);
  }

  const pcsx2Directory = path.join(os.homedir(), "Documents", "PCSX2");

  const configPath = path.join(pcsx2Directory, "inis", "PCSX2.ini");

  const profilePath = path.join(
    pcsx2Directory,
    "inputprofiles",
    `${profileName}.ini`,
  );

  if (!fs.existsSync(configPath)) {
    throw new Error("Configuração principal do PCSX2 não encontrada.");
  }

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Perfil do PCSX2 não encontrado: ${profileName}`);
  }

  const originalConfig = fs.readFileSync(configPath, "utf8");
  const profileContent = fs.readFileSync(profilePath, "utf8");

  let updatedConfig = originalConfig;

  for (const section of INPUT_SECTIONS) {
    const profileSection = getSection(profileContent, section);

    if (!profileSection) {
      throw new Error(`Seção [${section}] ausente no perfil ${profileName}.`);
    }

    updatedConfig = replaceSection(updatedConfig, section, profileSection);
  }

  if (updatedConfig !== originalConfig) {
    const backupPath = `${configPath}.gamelabs-backup`;

    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(configPath, backupPath);
    }

    const temporaryPath = `${configPath}.gamelabs-tmp`;

    try {
      fs.writeFileSync(temporaryPath, updatedConfig, "utf8");
      fs.renameSync(temporaryPath, configPath);
    } finally {
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    }
  }

  console.log(`[GameLabs] Perfil PCSX2 aplicado: ${profileName}`);

  return profileName;
}
