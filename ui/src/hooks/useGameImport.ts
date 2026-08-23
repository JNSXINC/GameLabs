import React from "react";
import { Game } from "../types/game";
import { resolveGameMetadata } from "../services/metadata/metadataResolver";
import { resolvePlatformFromFile } from "../shared/platforms";

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

        const { platform, emulatorId, launchType } = resolvePlatformFromFile(filePath);

        const isEmulated = launchType === "emulator";

        const alreadyExists = await new Promise<boolean>((resolve) => {
            setGames((prev) => {
                resolve(
                    prev.some(
                        (game) =>
                            game.path === filePath ||
                            game.gameFilePath === filePath
                    )
                );

                return prev;
            });
        });

        if (alreadyExists) {
            alert("Esse jogo já está na biblioteca.");
            return;
        }

        const metadata = await resolveGameMetadata(name);

        const now = Date.now();

        const newGame: Game = {
            id: `${name.toLowerCase().replace(/\s+/g, "-")}-${now}`,
            name: metadata.name || name,
            cover: metadata.cover,
            bg: metadata.bg,
            description: metadata.description || "",
            playtime: 0,
            installed: true,
            favorite: false,

            path: isEmulated ? "" : filePath,
            executablePath: isEmulated ? "" : filePath,
            gameFilePath: isEmulated ? filePath : "",

            launchType: isEmulated ? "emulator" : "pc",
            platform,
            emulatorId,
            controllerProfileId:
                platform === "windows"
                    ? "pc"
                    : ((platform || "default") as Game["controllerProfileId"]),
        };

        setGames((prev) => {
            const updatedGames = [...prev, newGame];

            window.electronAPI.saveLibrary(updatedGames);

            return updatedGames;
        });
    };

    return {
        importGameFile,
    };
}