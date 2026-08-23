import { getGameMetadata } from "./gameMetadata";
import { searchSteamGridGame } from "./providers/steamGridDb";

export async function resolveGameMetadata(gameName: string) {
    try {
        const onlineMetadata = await searchSteamGridGame(gameName);

        if (onlineMetadata) {
            return onlineMetadata;
        }

        return getGameMetadata(gameName);
    } catch (error) {
        console.error("Erro ao resolver metadata:", error);

        return {
            name: gameName,
            cover: "/default.jpg",
            bg: "/default-bg.jpg",
            description: "Sem descrição disponível.",
            platform: "windows",
        };
    }
}