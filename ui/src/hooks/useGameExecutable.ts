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
        setGames((prev) => {
            const updatedGames = prev.map((game) =>
                game.id === id
                    ? {
                        ...game,
                        path: "",
                        executablePath: "",
                    }
                    : game
            );

            window.electronAPI.saveLibrary(updatedGames);

            return updatedGames;
        });
    };
    const handleRemoveGameFromSystem = (gameId: string) => {
        setGames((prev) => {
            const updatedGames = prev.filter(
                (game) => game.id !== gameId
            );

            window.electronAPI.saveLibrary(updatedGames);

            return updatedGames;
        });
    };

    const setGameExecutable = async (id: string) => {
        const result = await window.electronAPI.selectGameExecutable();

        if (result.canceled || !result.path) return;

        setGames((prev) => {
            const updatedGames = prev.map((game) =>
                game.id === id
                    ? {
                        ...game,
                        path: result.path || "",
                        executablePath: result.path || "",
                    }
                    : game
            );

            window.electronAPI.saveLibrary(updatedGames);

            return updatedGames;
        });
    };

    return {
        handleOpenGameFolder,
        removeGameExecutable,
        handleRemoveGameFromSystem,
        setGameExecutable,
    };
}