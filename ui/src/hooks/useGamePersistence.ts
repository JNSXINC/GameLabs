import { useEffect } from "react";
import { Game } from "../types/game";

const GAMES_KEY = "gamelabs_games";
const GAME_PATHS_KEY = "gamelabs_game_paths";

export function useGamePersistence(games: Game[], setGames: React.Dispatch<React.SetStateAction<Game[]>>) {
    useEffect(() => {
        const saved = localStorage.getItem(GAMES_KEY);

        if (!saved) return;

        const parsedGames = JSON.parse(saved);

        const normalizedGames = parsedGames.map((game: Game) => {
            if (
                !game.controllerProfileId ||
                game.controllerProfileId === "default"
            ) {
                if (game.platform && game.platform !== "windows") {
                    return {
                        ...game,
                        controllerProfileId: game.platform,
                    };
                }

                return {
                    ...game,
                    controllerProfileId: "pc",
                };
            }

            return game;
        });

        setGames(normalizedGames);
    }, [setGames]);

    useEffect(() => {
        localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    }, [games]);

    useEffect(() => {
        try {
            const gamePaths = games.reduce<Record<string, string>>((acc, game) => {
                if (game.path) acc[game.id] = game.path;
                return acc;
            }, {});

            localStorage.setItem(GAME_PATHS_KEY, JSON.stringify(gamePaths));
        } catch { }
    }, [games]);
}