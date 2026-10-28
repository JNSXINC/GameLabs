import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { readControllerSettings } from "./controllerSettings";

const PROFILE_NAMES = {
  keyboard1: "GameLabs-Teclado1.ini",
  keyboard2: "GameLabs-Teclado2.ini",
  controller: "GameLabs-Controle.ini",
} as const;

function getSection(content: string, section: string): string {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pattern = new RegExp(
    `^\\[${escaped}\\]\\r?\\n[\\s\\S]*?(?=^\\[|$(?![\\s\\S]))`,
    "m",
  );

  const match = content.match(pattern);

  if (!match) {
    throw new Error(`Seção ${section} não encontrada.`);
  }

  return match[0];
}

function replaceSection(
  content: string,
  section: string,
  replacement: string,
): string {
  const original = getSection(content, section);

  return content.replace(original, replacement.trimEnd() + "\r\n\r\n");
}

export function applyDuckStationInputProfile(): void {
  const { inputDevice } = readControllerSettings();

  const duckStationDirectory = path.join(
    process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
    "duckstation",
  );

  const settingsPath = path.join(duckStationDirectory, "settings.ini");

  const profilePath = path.join(
    duckStationDirectory,
    "inputprofiles",
    PROFILE_NAMES[inputDevice],
  );

  if (!fs.existsSync(settingsPath)) {
    throw new Error("Configuração do DuckStation não encontrada.");
  }

  if (!fs.existsSync(profilePath)) {
    throw new Error(
      `Predefinição do DuckStation não encontrada: ${profilePath}`,
    );
  }

  const settings = fs.readFileSync(settingsPath, "utf8");
  const profile = fs.readFileSync(profilePath, "utf8");

  const pad1 = getSection(profile, "Pad1");

  let updated = replaceSection(settings, "Pad1", pad1);

  // O F10 é reservado à pausa em todos os modos.
  const hotkeys = getSection(updated, "Hotkeys");

  const newHotkeys = hotkeys
    .replace(/^TogglePause\s*=.*$/m, "TogglePause = Keyboard/F10")
    .replace(/^Screenshot\s*=\s*Keyboard\/F10$/m, "Screenshot = Keyboard/F9");

  if (
    newHotkeys === hotkeys &&
    !/^TogglePause\s*=\s*Keyboard\/F10$/m.test(hotkeys)
  ) {
    throw new Error("Atalho de pausa não encontrado.");
  }

  updated = replaceSection(updated, "Hotkeys", newHotkeys);

  if (updated === settings) {
    return;
  }

  const backupPath = `${settingsPath}.gamelabs-original`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(settingsPath, backupPath);
  }

  const tempPath = `${settingsPath}.gamelabs-tmp`;

  try {
    fs.writeFileSync(tempPath, updated, "utf8");
    fs.renameSync(tempPath, settingsPath);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }

  console.log(`[GameLabs] Perfil DuckStation aplicado: ${inputDevice}`);
}
