import { spawn, exec } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { applyPerformanceProfile } from "../settings/applyPerformanceProfile";
import { applyDuckStationInputProfile } from "../controls/duckStationInputProfiles";

type Game = {
  title: string;
  gameFilePath?: string;
  emulatorExecutablePath?: string;
};

export async function launchDuckStation(game: Game) {
  if (!game.emulatorExecutablePath) {
    throw new Error("Executável do DuckStation não configurado.");
  }

  if (!fs.existsSync(game.emulatorExecutablePath)) {
    throw new Error("Executável do DuckStation não encontrado.");
  }

  if (!game.gameFilePath) {
    throw new Error("ISO/ROM do PS1 não configurada.");
  }

  if (!fs.existsSync(game.gameFilePath)) {
    throw new Error("ISO/ROM do PS1 não encontrada.");
  }

  applyDuckStationInputProfile();

  const performanceProfile = applyPerformanceProfile(
    "duckstation",
    game.emulatorExecutablePath,
  );

  console.log(
    "Perfil de performance aplicado ao DuckStation:",
    performanceProfile,
  );

  const child = spawn(
    game.emulatorExecutablePath,
    ["-batch", "-fullscreen", game.gameFilePath],
    {
      detached: false,
      stdio: "ignore",
      windowsHide: false,
      cwd: path.dirname(game.emulatorExecutablePath),
    },
  );

  child.on("exit", () => {
    exec("taskkill /F /IM duckstation-qt-x64-ReleaseLTCG.exe");
    exec("taskkill /F /IM duckstation.exe");
    exec("taskkill /F /IM DuckStation.exe");
  });

  return child;
}
