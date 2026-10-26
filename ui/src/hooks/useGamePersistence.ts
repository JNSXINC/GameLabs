import { useEffect } from "react";
import { Game } from "../types/game";

const GAME_PATHS_KEY = "gamelabs_game_paths";

export function useGamePersistence(
  games: Game[],
  _setGames: React.Dispatch<React.SetStateAction<Game[]>>,
) {
  useEffect(() => {
    const gamePaths = games.reduce<Record<string, string>>((acc, game) => {
      if (game.path) {
        acc[game.id] = game.path;
      }

      return acc;
    }, {});

    localStorage.setItem(GAME_PATHS_KEY, JSON.stringify(gamePaths));
  }, [games]);
}
