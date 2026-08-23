export type ControllerSettings = {
    autoStartDS4: boolean;
    watchdogDS4: boolean;
    closeWithGameLabs: boolean;
    ds4Path: string;
};

export type ControllerProfileId =
    | "default"
    | "pc"
    | "ps1"
    | "ps2"
    | "psp"
    | "snes"
    | "gba"
    | "nes"
    | "gamecube"
    | "wii";

export type ControllerProfile = {
    id: ControllerProfileId;
    name: string;
    description: string;
};

export const controllerProfiles: ControllerProfile[] = [
    {
        id: "default",
        name: "Padrão",
        description: "Perfil padrão do DS4Windows.",
    },
    {
        id: "pc",
        name: "PC",
        description: "Perfil para jogos de PC.",
    },
    {
        id: "ps1",
        name: "PS1",
        description: "Perfil para jogos de PlayStation 1.",
    },
    {
        id: "ps2",
        name: "PS2",
        description: "Perfil para jogos de PlayStation 2.",
    },
    {
        id: "psp",
        name: "PSP",
        description: "Perfil para jogos de PlayStation Portable.",
    },
    {
        id: "gamecube",
        name: "GameCube",
        description: "Perfil para jogos de Nintendo GameCube.",
    },
    {
        id: "wii",
        name: "Wii",
        description: "Perfil para jogos de Nintendo Wii.",
    },
    {
        id: "snes",
        name: "SNES",
        description: "Perfil para jogos de Super Nintendo.",
    },
    {
        id: "gba",
        name: "GBA",
        description: "Perfil para jogos de Game Boy Advance.",
    },
    {
        id: "nes",
        name: "NES",
        description: "Perfil para jogos de Nintendo Entertainment System.",
    },
];