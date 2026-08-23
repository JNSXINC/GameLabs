import { EmulatorId } from "../shared/platforms";

export type ScannedGame = {
    id: string;
    name: string;

    executablePath: string;
    gameFilePath: string;

    folderPath: string;

    platform: string;

    launchType: "pc" | "emulator";

    emulatorId?: EmulatorId;
};