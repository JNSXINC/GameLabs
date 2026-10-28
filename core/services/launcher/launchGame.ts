import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { launchPCSX2 } from "./launchPCSX2";
import { launchPPSSPP } from "./launchPPSSPP";
import { launchDuckStation } from "./launchDuckStation";
import { launchRetroArch } from "./launchRetroArch";
import { launchDolphin } from "./launchDolphin";

import { readControllerSettings } from "../controls/controllerSettings";

import {
  applyControllerProfile,
  ControllerProfileId,
} from "../controls/controllerProfiles";

type Game = {
  id?: string;
  name?: string;
  title?: string;

  launchType?: "pc" | "emulator";
  platform?: string;

  path?: string;
  executablePath?: string;

  emulatorId?: string;
  gameFilePath?: string;
  emulatorExecutablePath?: string;

  controllerProfileId?: ControllerProfileId;
};

function getLaunchControllerProfile(game: Game): ControllerProfileId {
  if (game.platform === "windows") return "pc";

  if (
    game.platform === "ps1" ||
    game.platform === "ps2" ||
    game.platform === "psp" ||
    game.platform === "gamecube" ||
    game.platform === "wii" ||
    game.platform === "snes" ||
    game.platform === "gba" ||
    game.platform === "nes"
  ) {
    return game.platform;
  }

  return game.controllerProfileId || "default";
}

export async function launchGame(game: Game | string) {
  if (typeof game === "string") {
    return launchPcExecutable(game);
  }

  const controllerProfileId = getLaunchControllerProfile(game);

  console.log("Perfil recebido pelo launcher:", game.controllerProfileId);
  console.log("Perfil decidido pelo launcher:", controllerProfileId);

  const { inputDevice } = readControllerSettings();

  const launchType = game.launchType || "pc";

  if (launchType === "pc" || inputDevice === "controller") {
    await applyControllerProfile(controllerProfileId);
  } else {
    console.log(`[GameLabs] Modo de entrada selecionado: ${inputDevice}`);
  }

  if (launchType === "pc") {
    const executablePath = game.executablePath || game.path;

    if (!executablePath) {
      throw new Error("Executável não configurado.");
    }

    return launchPcExecutable(executablePath);
  }

  if (launchType === "emulator") {
    switch (game.emulatorId) {
      case "pcsx2":
        return launchPCSX2({
          ...game,
          title: game.title || game.name || "Jogo sem nome",
        });

      case "ppsspp":
        return launchPPSSPP({
          ...game,
          title: game.title || game.name || "Jogo sem nome",
        });

      case "duckstation":
        return launchDuckStation({
          ...game,
          title: game.title || game.name || "Jogo sem nome",
        });

      case "retroarch":
        return launchRetroArch({
          ...game,
          title: game.title || game.name || "Jogo sem nome",
        });

      case "dolphin":
        return launchDolphin({
          ...game,
          title: game.title || game.name || "Jogo sem nome",
        });

      default:
        throw new Error("Emulador não suportado.");
    }
  }

  throw new Error("Tipo de launcher inválido.");
}

function launchPcExecutable(executablePath: string) {
  if (!fs.existsSync(executablePath)) {
    throw new Error("Arquivo não encontrado.");
  }

  return spawn(executablePath, [], {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
    cwd: path.dirname(executablePath),
  }).unref();
}
