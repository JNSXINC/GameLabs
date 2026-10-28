import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { app } from "electron";

import { applyPerformanceProfile } from "../settings/applyPerformanceProfile";
import { readControllerSettings } from "../controls/controllerSettings";

type Game = {
  title: string;
  platform?: string;
  gameFilePath?: string;
  emulatorExecutablePath?: string;
};

const coreByPlatform: Record<string, string> = {
  snes: "snes9x_libretro.dll",
  gba: "mgba_libretro.dll",
  nes: "fceumm_libretro.dll",
  genesis: "genesis_plus_gx_libretro.dll",
  arcade: "fbneo_libretro.dll",
};

export async function launchRetroArch(game: Game) {
  if (!game.emulatorExecutablePath) {
    throw new Error("Executável do RetroArch não configurado.");
  }

  if (!fs.existsSync(game.emulatorExecutablePath)) {
    throw new Error("Executável do RetroArch não encontrado.");
  }

  if (!game.gameFilePath) {
    throw new Error("ROM não configurada.");
  }

  if (!fs.existsSync(game.gameFilePath)) {
    throw new Error("ROM não encontrada.");
  }

  if (!game.platform) {
    throw new Error("Plataforma não configurada.");
  }

  const coreFile = coreByPlatform[game.platform];

  if (!coreFile) {
    throw new Error(`Core não configurado para plataforma: ${game.platform}`);
  }

  const retroArchFolder = path.dirname(game.emulatorExecutablePath);
  const corePath = path.join(retroArchFolder, "cores", coreFile);

  if (!fs.existsSync(corePath)) {
    throw new Error(`Core do RetroArch não encontrado: ${coreFile}`);
  }

  const performanceProfile = applyPerformanceProfile("retroarch");

  console.log(
    "Perfil de performance aplicado ao RetroArch:",
    performanceProfile,
  );

  const { inputDevice } = readControllerSettings();

  const args = ["--fullscreen"];

  if (inputDevice !== "controller") {
    const keyboardProfile = path.join(
      retroArchFolder,
      "GameLabs-Profiles",
      "GameLabs-Teclado1.cfg",
    );

    if (!fs.existsSync(keyboardProfile)) {
      const bundledProfile = app.isPackaged
        ? path.join(
            process.resourcesPath,
            "templates",
            "RetroArch",
            "GameLabs-Teclado1.cfg",
          )
        : path.join(
            app.getAppPath(),
            "core",
            "services",
            "controls",
            "templates",
            "RetroArch",
            "GameLabs-Teclado1.cfg",
          );

      if (!fs.existsSync(bundledProfile)) {
        throw new Error("Perfil de teclado do RetroArch não encontrado.");
      }

      fs.mkdirSync(path.dirname(keyboardProfile), { recursive: true });
      fs.copyFileSync(bundledProfile, keyboardProfile);
    }

    args.push("--appendconfig", keyboardProfile);
  }

  args.push("-L", corePath, game.gameFilePath);

  console.log(`[GameLabs] RetroArch iniciado com modo: ${inputDevice}`);

  const child = spawn(game.emulatorExecutablePath, args, {
    detached: false,
    stdio: "ignore",
    windowsHide: false,
    cwd: retroArchFolder,
  });

  return child;
}
