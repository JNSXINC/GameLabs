import { Game } from "../types/game";

type Params = {
    setGames: React.Dispatch<React.SetStateAction<Game[]>>;
};

export function useGameFiles({ setGames }: Params) {
    const setGameFile = async (id: string) => {
        const result = await window.electronAPI.selectGameFile();

        if (result.canceled || !result.path) return;

        setGames((prev) =>
            prev.map((game) =>
                game.id === id
                    ? {
                        ...game,
                        gameFilePath: result.path || "",
                    }
                    : game
            )
        );
    };

    return {
        setGameFile,
    };
}