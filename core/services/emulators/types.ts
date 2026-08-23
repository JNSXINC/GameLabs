export type Platform =
    | "windows"
    | "ps1"
    | "ps2"
    | "psp"
    | "gamecube"
    | "wii"
    | "snes"
    | "nes"
    | "gba"
    | "genesis"
    | "arcade";

export type Emulator = {
    id: string;
    name: string;
    executablePath: string;
    platforms: Platform[];
    defaultArgs?: string[];
    biosPath?: string;
};