import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { applyPerformanceProfile } from "../settings/applyPerformanceProfile";

type Game = {
    title?: string;
    name?: string;
    gameFilePath?: string;
    emulatorExecutablePath?: string;
};

export async function launchPPSSPP(game: Game) {
    if (!game.emulatorExecutablePath) {
        throw new Error("Executável do PPSSPP não configurado.");
    }

    if (!game.gameFilePath) {
        throw new Error("Arquivo PSP não configurado.");
    }

    if (!fs.existsSync(game.emulatorExecutablePath)) {
        throw new Error("PPSSPP não encontrado.");
    }

    if (!fs.existsSync(game.gameFilePath)) {
        throw new Error("Arquivo PSP não encontrado.");
    }

    const performanceProfile =
        applyPerformanceProfile("ppsspp");

    console.log(
        "Perfil de performance aplicado ao PPSSPP:",
        performanceProfile
    );

    return spawn(
        game.emulatorExecutablePath, [game.gameFilePath], {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
        cwd: path.dirname(game.emulatorExecutablePath),
    }).unref();
}