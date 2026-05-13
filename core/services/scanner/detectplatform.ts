export function detectPlatform(filePath: string): string {
    const lower = filePath.toLowerCase();

    if (lower.includes("ps2")) return "ps2";
    if (lower.includes("ps1")) return "ps1";
    if (lower.includes("psp")) return "psp";
    if (lower.includes("wii")) return "wii";
    if (lower.includes("gamecube")) return "gamecube";
    if (lower.includes("gba")) return "gba";
    if (lower.includes("snes")) return "snes";

    return "windows";
}