import { useMemo } from "react";
import { Game } from "../types/game";

export function useLibraryStats(games: Game[]) {
    return useMemo(() => {
        const totalGames = games.length;

        const totalHours = games.reduce((sum, game) => {
            return sum + (game.playtime || 0);
        }, 0);

        const favoriteGames = games.filter((game) => game.favorite).length;

        const recentlyPlayed = games.filter((game) => {
            return Boolean(game.lastPlayed);
        }).length;

        return {
            totalGames,
            totalHours,
            favoriteGames,
            recentlyPlayed,
        };
    }, [games]);
}