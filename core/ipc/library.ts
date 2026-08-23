import { ipcMain } from "electron";
import {
    loadLibrary,
    saveLibrary,
    addGameToLibrary,
    updateGameInLibrary,
    removeGameFromLibrary,
} from "../services/library/libraryStore";

export function registerLibraryIpc() {
    ipcMain.removeHandler("library:load");
    ipcMain.removeHandler("library:save");
    ipcMain.removeHandler("library:add");
    ipcMain.removeHandler("library:update");
    ipcMain.removeHandler("library:remove");

    ipcMain.handle("library:load", async () => {
        console.log("IPC library:load executado");
        return loadLibrary();
    });

    ipcMain.handle("library:save", async (_event, games) => {
        console.log("IPC library:save executado");
        return saveLibrary(games);
    });

    ipcMain.handle("library:add", async (_event, game) => {
        return addGameToLibrary(game);
    });

    ipcMain.handle("library:update", async (_event, gameId, patch) => {
        return updateGameInLibrary(gameId, patch);
    });

    ipcMain.handle("library:remove", async (_event, gameId) => {
        return removeGameFromLibrary(gameId);
    });
}