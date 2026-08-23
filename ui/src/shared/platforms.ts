import { Game } from "../types/game";

export type EmulatorId =
    | "pcsx2"
    | "duckstation"
    | "ppsspp"
    | "dolphin"
    | "retroarch";

export type PlatformResolution = {
    platform: Game["platform"];
    emulatorId?: EmulatorId;
    launchType: "pc" | "emulator";
};

const getExtension = (filePath: string) => {
    return filePath.split(".").pop()?.toLowerCase() || "";
};

export function resolvePlatformFromFile(filePath: string): PlatformResolution {
    const lower = filePath.toLowerCase();
    const extension = getExtension(filePath);

    if (
        lower.includes("psp") ||
        extension === "cso" ||
        extension === "pbp"
    ) {
        return {
            platform: "psp",
            emulatorId: "ppsspp",
            launchType: "emulator",
        };
    }

    if (
        lower.includes("ps1") ||
        lower.includes("playstation 1") ||
        lower.includes("playstation1")
    ) {
        return {
            platform: "ps1",
            emulatorId: "duckstation",
            launchType: "emulator",
        };
    }

    if (
        lower.includes("wii") ||
        extension === "rvz" ||
        extension === "wbfs"
    ) {
        return {
            platform: "wii",
            emulatorId: "dolphin",
            launchType: "emulator",
        };
    }

    if (
        lower.includes("gamecube") ||
        lower.includes("game cube") ||
        extension === "gcm"
    ) {
        return {
            platform: "gamecube",
            emulatorId: "dolphin",
            launchType: "emulator",
        };
    }

    if (
        extension === "sfc" ||
        extension === "smc"
    ) {
        return {
            platform: "snes",
            emulatorId: "retroarch",
            launchType: "emulator",
        };
    }

    if (extension === "gba") {
        return {
            platform: "gba",
            emulatorId: "retroarch",
            launchType: "emulator",
        };
    }

    if (extension === "nes") {
        return {
            platform: "nes",
            emulatorId: "retroarch",
            launchType: "emulator",
        };
    }

    if (
        extension === "iso" ||
        extension === "bin" ||
        extension === "cue" ||
        extension === "chd"
    ) {
        return {
            platform: "ps2",
            emulatorId: "pcsx2",
            launchType: "emulator",
        };
    }

    return {
        platform: "windows",
        launchType: "pc",
    };
}