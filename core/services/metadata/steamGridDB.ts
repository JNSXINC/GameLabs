import { metadataConfig } from "./config";

import * as path from "node:path";
import * as fs from "node:fs";
import { downloadImage } from "./downloadImage";

const API_URL = "https://www.steamgriddb.com/api/v2";

type SteamGridGame = {
    id: number;
    name: string;
};

export async function searchSteamGridGame(gameName: string) {
    try {

        function imageToDataUrl(filePath: string | null) {
            if (!filePath || !fs.existsSync(filePath)) {
                return null;
            }

            const buffer = fs.readFileSync(filePath);
            const base64 = buffer.toString("base64");

            return `data:image/jpeg;base64,${base64}`;
        }

        const response = await fetch(
            `${API_URL}/search/autocomplete/${encodeURIComponent(gameName)}`,
            {
                headers: {
                    Authorization: `Bearer ${metadataConfig.steamGridDbApiKey}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Falha ao buscar jogo na SteamGridDB.");
        }

        const data = await response.json();
        console.log("STEAMGRID SEARCH:", gameName, data);

        const game: SteamGridGame | undefined = data?.data?.[0];

        if (!game) {
            return null;
        }

        const gridsResponse = await fetch(
            `${API_URL}/grids/game/${game.id}?dimensions=600x900`,
            {
                headers: {
                    Authorization: `Bearer ${metadataConfig.steamGridDbApiKey}`,
                },
            }
        );

        const heroesResponse = await fetch(
            `${API_URL}/heroes/game/${game.id}`,
            {
                headers: {
                    Authorization: `Bearer ${metadataConfig.steamGridDbApiKey}`,
                },
            }
        );

        const gridsData = await gridsResponse.json();
        const heroesData = await heroesResponse.json();

        const coverUrl = gridsData?.data?.[0]?.url;
        const bgUrl = heroesData?.data?.[0]?.url;

        const safeName = game.name
            .toLowerCase()
            .replace(/[^a-z0-9]/gi, "-");

        const coverOutput = path.join(
            process.cwd(),
            "data/cache/covers",
            `${safeName}.jpg`
        );

        const bgOutput = path.join(
            process.cwd(),
            "data/cache/backgrounds",
            `${safeName}.jpg`
        );

        const downloadedCover = coverUrl
            ? await downloadImage(coverUrl, coverOutput)
            : null;

        const downloadedBg = bgUrl
            ? await downloadImage(bgUrl, bgOutput)
            : null;

        const toCacheUrl = (filePath: string | null) => {
            if (!filePath) return null;

            const fileName = path.basename(filePath);
            const folder = filePath.includes("backgrounds") ? "backgrounds" : "covers";

            return `gamelabs-cache://${folder}/${encodeURIComponent(fileName)}`;
        };

        const cover = imageToDataUrl(downloadedCover) || "/default.jpg";
        const bg = imageToDataUrl(downloadedBg) || "/default-bg.jpg";

        return {
            name: game.name,
            cover,
            bg,
            description: `Metadata online encontrada para ${game.name}.`,
            platform: "windows",
        };
    } catch (error) {
        console.error("Erro SteamGridDB:", error);

        return null;
    }
}