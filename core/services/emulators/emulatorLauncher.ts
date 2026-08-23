import { spawn } from "node:child_process";

import { emulatorRegistry } from "./emulatorRegistry";

type Game = {
    title: string;

    launchType: "pc" | "emulator";

    executablePath?: string;

    emulatorId?: string;

    gameFilePath?: string;
};

export async function launchEmulatorGame(game: Game) {
    if (!game.emulatorId) {
        throw new Error("Emulador não definido.");
    }

    const emulator = emulatorRegistry.find(
        (e) => e.id === game.emulatorId
    );

    if (!emulator) {
        throw new Error("Emulador não encontrado.");
    }

    if (!emulator.executablePath) {
        throw new Error("Executável do emulador não configurado.");
    }

    if (!game.gameFilePath) {
        throw new Error("ROM/ISO não encontrada.");
    }

    const args = [
        ...(emulator.defaultArgs || []),
        game.gameFilePath,
    ];

    spawn(emulator.executablePath, args, {
        detached: true,
        stdio: "ignore",
    }).unref();
}