import { useMemo, useState } from "react";
import { Game } from "../types/game";



export function useFavorites(initialGames: Game[]) {

    const [games, setGames] = useState<Game[]>(initialGames);

    const favorites = useMemo(
        () => games.filter((game) => game.favorite),
        [games]
    );

    const toggleFavorite = (id: string) => {
        setGames((prev) => {
            const updatedGames = prev.map((game) =>
                game.id === id
                    ? { ...game, favorite: !game.favorite }
                    : game
            );

            window.electronAPI.saveLibrary(updatedGames);

            return updatedGames;
        });
    };

    return {
        games,
        setGames,
        favorites,
        toggleFavorite,
    };
}