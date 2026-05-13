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
        id: "retroarch",
        name: "RetroArch",
        executablePath: "",

        platforms: ["snes", "gba", "ps1"],

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