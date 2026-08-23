import { execFile } from "node:child_process";
import { readControllerSettings } from "./controllerSettings";

export type ControllerProfileId =
    | "default"
    | "pc"
    | "ps1"
    | "ps2"
    | "psp"
    | "gamecube"
    | "wii"
    | "snes"
    | "gba"
    | "nes";

const profileNameMap: Record<ControllerProfileId, string> = {
    default: "Default",
    pc: "PC",
    ps1: "PS1",
    ps2: "PS2",
    psp: "PSP",
    gamecube: "GameCube",
    wii: "Wii",
    snes: "SNES",
    gba: "GBA",
    nes: "NES",
};

export function getControllerProfileName(id?: ControllerProfileId) {
    return profileNameMap[id || "default"] || "Default";
}

export function applyControllerProfile(id?: ControllerProfileId) {
    const profileName = getControllerProfileName(id);
    const settings = readControllerSettings();
    const ds4Path = settings.ds4Path;

    console.log(`Aplicando perfil DS4: ${profileName}`);

    if (!ds4Path) {
        console.warn("DS4Windows não configurado para troca de perfil.");
        return Promise.resolve(profileName);
    }

    return new Promise<string>((resolve) => {
        execFile(
            ds4Path,
            ["-command", `LoadTempProfile.1.${profileName}`],
            { windowsHide: true },
            (error) => {
                if (error) {
                    console.warn("Falha ao aplicar perfil DS4:", error.message);
                } else {
                    console.log(`Perfil DS4 aplicado: ${profileName}`);
                }

                resolve(profileName);
            }
        );
    });
}