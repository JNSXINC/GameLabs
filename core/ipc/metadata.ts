import { ipcMain } from "electron";
import { searchSteamGridGame } from "../services/metadata/steamGridDB";

export function registerMetadataIpc() {
    ipcMain.handle(
        "metadata:search-steamgriddb",
        async (_, gameName: string) => {
            return searchSteamGridGame(gameName);
        }
    );
}