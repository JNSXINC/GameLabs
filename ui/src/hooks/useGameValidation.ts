import { useEffect, useState } from "react";
import { Game } from "../types/game";

export type GameStatus = "none" | "valid" | "invalid";

export function useGameValidation(games: Game[]) {
    const [gameStatus, setGameStatus] = useState<Record<string, GameStatus>>({});

    useEffect(() => {
        let cancelled = false;

        const checkPaths = async () => {
            const statusMap: Record<string, GameStatus> = {};

            for (const game of games) {
                const fileToCheck =
                    game.launchType === "emulator" ? game.gameFilePath : game.path;

                if (!fileToCheck) {
                    statusMap[game.id] = "none";
                    continue;
                }

                const result = await window.electronAPI.checkGamePath(fileToCheck);
                statusMap[game.id] = result.exists ? "valid" : "invalid";
            }

            if (!cancelled) {
                setGameStatus(statusMap);
            }
        };

        checkPaths();

        return () => {
            cancelled = true;
        };
    }, [games]);

    return {
        gameStatus,
    };
}