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
    setGames: React.Dispatch<React.SetStateAction<Game[]>>;
};

export function useGameLauncher({
    gameStatus,
    filteredLibraryGames,
    emulators = [],
    setScreen,
    setSelected,
    setGames,
}: Params) {
    const [isLaunching, setIsLaunching] = useState(false);
    const [lastPlayedGameId, setLastPlayedGameId] = useState<string | null>(null);
    const [launchStartTime, setLaunchStartTime] = useState<number | null>(null);

    useEffect(() => {
        const unsubscribe = window.electronAPI.onGameClosed(() => {
            setIsLaunching(false);

            if (lastPlayedGameId && launchStartTime) {
                const playedMs = Date.now() - launchStartTime;
                const playedHours = playedMs / 1000 / 60 / 60;

                setGames((prev) => {
                    const updatedGames = prev.map((game) =>
                        game.id === lastPlayedGameId
                            ? {
                                ...game,
                                playtime:
                                    Number(game.playtime || 0) + playedHours,
                            }
                            : game
                    );

                    window.electronAPI.saveLibrary(updatedGames);

                    return updatedGames;
                });

                setLaunchStartTime(null);
            }

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
    }, [
        lastPlayedGameId,
        launchStartTime,
        filteredLibraryGames,
        setScreen,
        setSelected,
        setGames,
    ]);

    const getCompatibleEmulator = (game: Game) => {
        if (!game.platform) return null;

        return (
            emulators.find((emulator) =>
                emulator.platforms.includes(game.platform as any)
            ) || null
        );
    };

    const launchPcGame = async (
        game: Game
    ): Promise<LaunchResult | undefined> => {
        const status = gameStatus[game.id];

        if (status === "none") {
            alert("Executável não configurado.");
            return;
        }

        if (status === "invalid") {
            alert("Arquivo não encontrado. Reconfigure o executável.");
            return;
        }

        const executablePath = game.executablePath || game.path;

        if (!executablePath) {
            alert("Caminho do executável não encontrado.");
            return;
        }

        return window.electronAPI.launchGame({
            ...game,
            launchType: "pc",
            executablePath,
        });
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

        const emulatorExecutablePath = emulator.executablePath;

        if (
            typeof emulatorExecutablePath !== "string" ||
            !emulatorExecutablePath.trim()
        ) {
            alert(`Executável do ${emulator.name} inválido.`);
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

        return window.electronAPI.launchGame({
            ...game,
            launchType: "emulator",
            emulatorId: game.emulatorId || emulator.id,
            gameFilePath: game.gameFilePath,
            emulatorExecutablePath,
        });
    };

    const handleLaunchGame = async (game: Game | null) => {
        if (!game) return;

        const now = Date.now();

        setIsLaunching(true);
        setLastPlayedGameId(game.id);
        setLaunchStartTime(now);

        setGames((prev) => {
            const updatedGames = prev.map((item) =>
                item.id === game.id
                    ? { ...item, lastPlayed: now }
                    : item
            );

            window.electronAPI.saveLibrary(updatedGames);

            return updatedGames;
        });

        try {
            const isEmulatorGame =
                !!game.gameFilePath || game.launchType === "emulator";

            const result: LaunchResult | undefined = isEmulatorGame
                ? await launchEmulatedGame(game)
                : await launchPcGame(game);

            if (!result) {
                setIsLaunching(false);
                setLaunchStartTime(null);
                return;
            }

            if (!result.success) {
                setIsLaunching(false);
                setLaunchStartTime(null);

                alert(`Falha ao iniciar: ${result.error}`);
            }
        } catch (error) {
            console.error(error);

            setIsLaunching(false);
            setLaunchStartTime(null);

            alert("Erro inesperado ao iniciar o jogo.");
        }
    };

    return {
        isLaunching,
        lastPlayedGameId,
        handleLaunchGame,
    };
}