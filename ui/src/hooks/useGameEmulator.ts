import { Emulator } from "../types/emulator";
import { Game } from "../types/game";

type Params = {
    emulators: Emulator[];
};

export function useGameEmulator({ emulators }: Params) {
    const getGameEmulator = (game: Game) => {
        if (game.launchType !== "emulator") {
            return null;
        }

        const emulator = emulators.find((emulator) =>
            emulator.platforms.includes(game.platform!)
        );

        if (!emulator) {
            return null;
        }

        return emulator;
    };

    const isGameReady = (game: Game) => {
        if (game.launchType === "pc") {
            return !!game.path;
        }

        const emulator = getGameEmulator(game);

        if (!emulator) {
            return false;
        }

        if (!emulator.executablePath) {
            return false;
        }

        if (emulator.biosRequired && !emulator.biosConfigured) {
            return false;
        }

        return true;
    };

    return {
        getGameEmulator,
        isGameReady,
    };
}