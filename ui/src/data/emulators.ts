import { Emulator } from "../types/emulator";

export const emulators: Emulator[] = [
    {
        id: "pcsx2",
        name: "PCSX2",
        executablePath: "",
        platforms: ["ps2"],

        biosPath: "",
        biosRequired: false,
        biosConfigured: false,

        defaultArgs: ["-fullscreen", "-nogui"],

        installed: false,
    },

    {
        id: "ppsspp",
        name: "PPSSPP",
        executablePath: "",
        platforms: ["psp"],

        biosPath: "",

        defaultArgs: [],

        installed: false,

        biosRequired: false,
    },

    {
        id: "duckstation",
        name: "DuckStation",
        executablePath: "",
        platforms: ["ps1"],

        biosPath: "",

        defaultArgs: [],

        installed: false,

        biosRequired: false,
    },

    {
        id: "retroarch",
        name: "RetroArch",
        executablePath: "",

        platforms: ["snes", "nes", "gba", "genesis", "arcade"],

        biosPath: "",

        defaultArgs: [],

        installed: false,

        biosRequired: false,
    },

    {
        id: "dolphin",
        name: "Dolphin",
        executablePath: "",

        platforms: ["gamecube", "wii"],

        biosPath: "",

        defaultArgs: [],

        installed: false,

        biosRequired: false,
    },
];