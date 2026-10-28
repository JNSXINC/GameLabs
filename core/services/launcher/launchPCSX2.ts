import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { applyPerformanceProfile } from "../settings/applyPerformanceProfile";
import { applyPCSX2InputProfile } from "../controls/pcsx2InputProfiles";

type Game = {
  title: string;
  gameFilePath?: string;
  emulatorExecutablePath?: string;
};

export async function launchPCSX2(game: Game) {
  if (!game.emulatorExecutablePath) {
    throw new Error("Executável do PCSX2 não configurado.");
  }

  if (!fs.existsSync(game.emulatorExecutablePath)) {
    throw new Error("Executável do PCSX2 não encontrado.");
  }

  if (!game.gameFilePath) {
    throw new Error("ISO/ROM do PS2 não configurada.");
  }

  if (!fs.existsSync(game.gameFilePath)) {
    throw new Error("ISO/ROM do PS2 não encontrada.");
  }

  try {
    const performanceProfile = applyPerformanceProfile(
      "pcsx2",
      game.emulatorExecutablePath,
    );

    console.log("[PCSX2] Perfil de desempenho:", performanceProfile);
  } catch (error) {
    console.warn(
      "[PCSX2] Não foi possível aplicar o perfil. Iniciando com as configurações existentes.",
      error,
    );
  }

  const inputProfile = applyPCSX2InputProfile();

  console.log("[PCSX2] Perfil de entrada:", inputProfile);

  const child = spawn(
    game.emulatorExecutablePath,
    [game.gameFilePath, "-fullscreen", "-nogui"],
    {
      detached: false,
      stdio: "ignore",
      windowsHide: false,
      cwd: path.dirname(game.emulatorExecutablePath),
    },
  );

  return child;
}
