import { Game } from "../types/game";

type Params = {
    setGames: React.Dispatch<React.SetStateAction<Game[]>>;
};

export function useGameExecutable({ setGames }: Params) {
    const handleOpenGameFolder = async (game: Game | null) => {
        if (!game?.path) {
            alert("Executável não configurado.");
            return;
        }

        const result = await window.electronAPI.openGameFolder(game.path);

        if (!result.success) {
            alert(`Falha ao abrir pasta: ${result.error}`);
        }
    };

    const removeGameExecutable = (id: string) => {
        setGames((prev) =>
            prev.map((game) => (game.id === id ? { ...game, path: "" } : game))
        );
    };

    const handleRemoveGameFromSystem = (gameId: string) => {
        setGames((prev) => prev.filter((game) => game.id !== gameId));
    };

    const setGameExecutable = async (id: string) => {
        const result = await window.electronAPI.selectGameExecutable();

        if (result.canceled || !result.path) return;

        setGames((prev) =>
            prev.map((game) =>
                game.id === id ? { ...game, path: result.path || "" } : game
            )
        );
    };

    return {
        handleOpenGameFolder,
        removeGameExecutable,
        handleRemoveGameFromSystem,
        setGameExecutable,
    };
}