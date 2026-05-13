import { useEffect, useMemo, useState } from "react";
import { Game } from "../types/game";

const FAVORITES_KEY = "gamelabs_favorites";

export function useFavorites(initialGames: Game[]) {
    const [games, setGames] = useState<Game[]>(() => {
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);

            if (!saved) {
                return initialGames;
            }

            const favoriteIds: string[] = JSON.parse(saved);

            return initialGames.map((game) => ({
                ...game,
                favorite: favoriteIds.includes(game.id),
            }));
        } catch {
            return initialGames;
        }
    });

    useEffect(() => {
        try {
            const favoriteIds = games
                .filter((game) => game.favorite)
                .map((game) => game.id);

            localStorage.setItem(
                FAVORITES_KEY,
                JSON.stringify(favoriteIds)
            );
        } catch { }
    }, [games]);

    const favorites = useMemo(
        () => games.filter((game) => game.favorite),
        [games]
    );

    const toggleFavorite = (id: string) => {
        setGames((prev) =>
            prev.map((game) =>
                game.id === id
                    ? { ...game, favorite: !game.favorite }
                    : game
            )
        );
    };

    return {
        games,
        setGames,
        favorites,
        toggleFavorite,
    };
}