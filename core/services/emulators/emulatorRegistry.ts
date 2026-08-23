import { Emulator } from "./types";

export const emulatorRegistry: Emulator[] = [
    {
        id: "pcsx2",
        name: "PCSX2",
        executablePath: "",
        platforms: ["ps2"],
        defaultArgs: ["--fullscreen"],
    },
    {
        id: "ppsspp",
        name: "PPSSPP",
        executablePath: "",
        platforms: ["psp"],
        defaultArgs: [],
    },
    {
        id: "duckstation",
        name: "DuckStation",
        executablePath: "",
        platforms: ["ps1"],
        defaultArgs: [],
    },
    {
        id: "dolphin",
        name: "Dolphin",
        executablePath: "",
        platforms: ["gamecube", "wii"],
        defaultArgs: [],
    },
    {
        id: "retroarch",
        name: "RetroArch",
        executablePath: "",
        platforms: ["snes", "nes", "gba", "genesis", "arcade"],
        defaultArgs: [],
    },

];