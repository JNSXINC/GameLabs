import { dialog, ipcMain } from "electron";
import { scanLibrary } from "../services/scanner/scanLibrary";

export function registerGameScannerIpc() {
    ipcMain.handle("games:scan-folder", async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ["openDirectory"],
            });

            if (result.canceled || result.filePaths.length === 0) {
                return [];
            }

            const folderPath = result.filePaths[0];
            const scannedGames = scanLibrary(folderPath);

            return scannedGames;
        } catch (error) {
            console.error("Erro no IPC do scanner:", error);
            throw error;
        }
    });
}