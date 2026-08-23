import { ipcMain, dialog } from "electron";
import { launchGame } from "../services/launcher/launchGame";
import { scanLibrary } from "../services/scanner/scanLibrary";

export function registerGameScannerIpc() {
    ipcMain.removeHandler("games:launch");
    ipcMain.removeHandler("games:scan-folder");

    ipcMain.handle("games:launch", async (_event, game) => {
        try {
            await launchGame(game);

            return {
                success: true,
            };
        } catch (error) {
            console.error("Erro ao iniciar jogo:", error);

            return {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao iniciar jogo.",
            };
        }
    });

    ipcMain.handle("games:scan-folder", async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: "Selecionar pasta de jogos",
                properties: ["openDirectory"],
            });

            if (result.canceled || result.filePaths.length === 0) {
                return [];
            }

            const folderPath = result.filePaths[0];

            return scanLibrary(folderPath);
        } catch (error) {
            console.error("Erro ao escanear pasta de jogos:", error);
            return [];
        }
    });
}