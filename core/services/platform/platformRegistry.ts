import * as path from "node:path";
import type { Platform } from "../emulators/types";

export type EmulatorId =
    | "duckstation"
    | "pcsx2"
    | "retroarch"
    | "ppsspp"
    | "dolphin";

export const VALID_GAME_EXTENSIONS = [
    ".exe",
    ".iso",
    ".bin",
    ".cue",
    ".chd",
    ".cso",
    ".pbp",
    ".sfc",
    ".smc",
    ".gba",
    ".nes",
    ".gcm",
    ".wbfs",
    ".rvz",
];

export function detectPlatform(filePath: string): Platform {
    const lower = filePath.toLowerCase();
    const ext = path.extname(lower);

    if (ext === ".exe") return "windows";

    if (ext === ".rvz" || ext === ".wbfs") return "wii";
    if (ext === ".gcm") return "gamecube";

    if ([".cso", ".pbp"].includes(ext)) return "psp";

    if ([".iso", ".bin", ".cue", ".chd"].includes(ext)) {
        if (lower.includes("psp")) return "psp";
        if (lower.includes("ps1")) return "ps1";
        if (lower.includes("wii")) return "wii";
        if (lower.includes("gamecube")) return "gamecube";
        return "ps2";
    }

    if (ext === ".gba") return "gba";
    if (ext === ".sfc" || ext === ".smc") return "snes";
    if (ext === ".nes") return "nes";

    if (lower.includes("wii")) return "wii";
    if (lower.includes("gamecube")) return "gamecube";
    if (lower.includes("ps2")) return "ps2";
    if (lower.includes("ps1")) return "ps1";
    if (lower.includes("psp")) return "psp";
    if (lower.includes("gba")) return "gba";
    if (lower.includes("snes")) return "snes";

    return "windows";
}

export function getDefaultEmulatorId(platform: Platform) {
    if (platform === "ps1") return "duckstation";
    if (platform === "ps2") return "pcsx2";
    if (platform === "psp") return "ppsspp";

    if (["snes", "gba", "nes", "genesis", "arcade"].includes(platform)) {
        return "retroarch";
    }

    if (["gamecube", "wii"].includes(platform)) {
        return "dolphin";
    }

    return undefined;
}