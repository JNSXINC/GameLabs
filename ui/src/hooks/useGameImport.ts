import { Game } from "../types/game";
import { getGameMetadata } from "../services/metadata/gameMetadata";

type Params = {
    setGames: React.Dispatch<React.SetStateAction<Game[]>>;
};

const getFileNameWithoutExtension = (filePath: string) => {
    const normalized = filePath.replace(/\\/g, "/");
    const fileName = normalized.split("/").pop() || "Jogo importado";
    return fileName.replace(/\.[^/.]+$/, "");
};

const getExtension = (filePath: string) => {
    return filePath.split(".").pop()?.toLowerCase() || "";
};

export function useGameImport({ setGames }: Params) {
    const importGameFile = async () => {
        const result = await window.electronAPI.selectGameFile();

        if (result.canceled || !result.path) return;

        const filePath = result.path;
        const extension = getExtension(filePath);
        const name = getFileNameWithoutExtension(filePath);
        const metadata = getGameMetadata(name);

        const isPs2 = ["iso", "bin", "cue", "chd"].includes(extension);

        const newGame: Game = {
            id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            name: metadata.name,
            cover: metadata.cover,
            bg: metadata.bg,
            description: metadata.description,
            playtime: 0,
            installed: true,
            favorite: false,

            path: isPs2 ? "" : filePath,
            gameFilePath: isPs2 ? filePath : "",

            launchType: isPs2 ? "emulator" : "pc",
            platform: isPs2 ? metadata.platform : "windows",
            emulatorId: isPs2 ? "pcsx2" : undefined,
        };

        setGames((prev) => {
            const alreadyExists = prev.some(
                (game) => game.path === filePath || game.gameFilePath === filePath
            );

            if (alreadyExists) {
                alert("Esse jogo já está na biblioteca.");
                return prev;
            }

            return [...prev, newGame];
        });
    };

    return {
        importGameFile,
    };
}