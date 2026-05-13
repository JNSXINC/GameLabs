import { useEffect, useState } from "react";
import { Emulator } from "../types/emulator";
import { Game } from "../types/game";
import { GameStatus } from "./useGameValidation";

type LaunchResult = {
    success: boolean;
    error?: string;
};

type Params = {
    gameStatus: Record<string, GameStatus>;
    filteredLibraryGames: Game[];
    emulators?: Emulator[];
    setScreen: (screen: "library") => void;
    setSelected: (value: number) => void;
};

export function useGameLauncher({
    gameStatus,
    filteredLibraryGames,
    emulators = [],
    setScreen,
    setSelected,
}: Params) {
    const [isLaunching, setIsLaunching] = useState(false);
    const [lastPlayedGameId, setLastPlayedGameId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = window.electronAPI.onGameClosed(() => {
            setIsLaunching(false);
            setScreen("library");

            if (lastPlayedGameId) {
                const gameIndex = filteredLibraryGames.findIndex(
                    (game) => game.id === lastPlayedGameId
                );

                if (gameIndex >= 0) {
                    setSelected(gameIndex);
                }
            }
        });

        return unsubscribe;
    }, [lastPlayedGameId, filteredLibraryGames, setScreen, setSelected]);

    const getCompatibleEmulator = (game: Game) => {
        if (!game.platform) return null;

        return (
            emulators.find((emulator) =>
                emulator.platforms.includes(game.platform!)
            ) || null
        );
    };

    const launchPcGame = async (game: Game): Promise<LaunchResult | undefined> => {
        const status = gameStatus[game.id];

        if (status === "none") {
            alert("Executável não configurado.");
            return;
        }

        if (status === "invalid") {
            alert("Arquivo não encontrado. Reconfigure o executável.");
            return;
        }

        if (!game.path) {
            alert("Caminho do executável não encontrado.");
            return;
        }

        return window.electronAPI.launchGame(game.path);
    };

    const launchEmulatedGame = async (
        game: Game
    ): Promise<LaunchResult | undefined> => {
        const emulator = getCompatibleEmulator(game);

        if (!emulator) {
            alert("Nenhum emulador compatível configurado para esta plataforma.");
            return;
        }

        if (!emulator.executablePath) {
            alert(`Configure o executável do ${emulator.name} em Settings.`);
            return;
        }

        if (emulator.biosRequired && !emulator.biosConfigured) {
            alert(`Configure a BIOS do ${emulator.name} em Settings.`);
            return;
        }

        if (!game.gameFilePath) {
            alert("Arquivo do jogo/ROM/ISO não configurado.");
            return;
        }

        return window.electronAPI.launchGame(emulator.executablePath, [
            ...(emulator.defaultArgs || []),
            game.gameFilePath,
        ]);
    };

    const handleLaunchGame = async (game: Game | null) => {
        if (!game) return;

        setIsLaunching(true);
        setLastPlayedGameId(game.id);

        try {
            const result: LaunchResult | undefined =
                game.launchType === "emulator"
                    ? await launchEmulatedGame(game)
                    : await launchPcGame(game);

            if (!result) {
                setIsLaunching(false);
                return;
            }

            if (!result.success) {
                setIsLaunching(false);
                alert(`Falha ao iniciar: ${result.error}`);
            }
        } catch {
            setIsLaunching(false);
            alert("Erro inesperado ao iniciar o jogo.");
        }
    };

    return {
        isLaunching,
        lastPlayedGameId,
        handleLaunchGame,
    };
}