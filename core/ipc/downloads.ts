import { ipcMain } from "electron";
import { downloadEmulator } from "../services/download/downloadEmulator";

export function registerDownloadsIpc() {
    ipcMain.handle("downloads:emulator", async (_, emulatorId: string) => {
        return downloadEmulator(emulatorId);
    });
}