import { Platform } from "../types/game";

export type GameMetadata = {
    name: string;
    cover: string;
    bg: string;
    description: string;
    platform: Platform;
};

const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function getGameMetadata(fileName: string): GameMetadata {
    const key = normalize(fileName);

    if (key.includes("godofwar") || key.includes("gow")) {
        return {
            name: "God of War",
            cover: "covers/gow.jpg",
            bg: "backgrounds/gow.jpg",
            description: "Kratos enfrenta deuses e monstros em uma jornada épica.",
            platform: "ps2",
        };
    }

    if (key.includes("needforspeed") || key.includes("mostwanted") || key.includes("nfs")) {
        return {
            name: "Need for Speed Most Wanted",
            cover: "covers/nfs.jpg",
            bg: "backgrounds/nfs.jpg",
            description: "Corridas ilegais, perseguições e velocidade extrema.",
            platform: "ps2",
        };
    }

    if (key.includes("residentevil4") || key.includes("re4")) {
        return {
            name: "Resident Evil 4",
            cover: "covers/re4.jpg",
            bg: "backgrounds/re4.jpg",
            description: "Sobreviva ao terror em uma missão cheia de ação.",
            platform: "ps2",
        };
    }

    if (key.includes("gta") || key.includes("sanandreas")) {
        return {
            name: "GTA San Andreas",
            cover: "covers/gta-sa.jpg",
            bg: "backgrounds/gta-sa.jpg",
            description: "Domine as ruas e construa seu império no mundo aberto.",
            platform: "ps2",
        };
    }

    return {
        name: fileName,
        cover: "default.jpg",
        bg: "default-bg.jpg",
        description: "Jogo importado automaticamente.",
        platform: "ps2",
    };
}