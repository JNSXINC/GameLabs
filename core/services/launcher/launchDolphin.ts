import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { applyPerformanceProfile } from "../settings/applyPerformanceProfile";

type Game = {
    title: string;
    gameFilePath?: string;
    emulatorExecutablePath?: string;
};

export async function launchDolphin(game: Game) {
    if (!game.emulatorExecutablePath) {
        throw new Error("Executável do Dolphin não configurado.");
    }

    if (!fs.existsSync(game.emulatorExecutablePath)) {
        throw new Error("Executável do Dolphin não encontrado.");
    }

    if (!game.gameFilePath) {
        throw new Error("ISO/ROM do GameCube/Wii não configurada.");
    }

    if (!fs.existsSync(game.gameFilePath)) {
        throw new Error("ISO/ROM do GameCube/Wii não encontrada.");
    }

    const performanceProfile =
        applyPerformanceProfile("dolphin");

    console.log(
        "Perfil de performance aplicado ao Dolphin:",
        performanceProfile
    );

    const child = spawn(
        game.emulatorExecutablePath,
        [
            "--batch",
            "--exec",
            game.gameFilePath,
        ],
        {
            detached: false,
            stdio: "ignore",
            windowsHide: false,
            cwd: path.dirname(game.emulatorExecutablePath),
        }
    );

    return child;
}