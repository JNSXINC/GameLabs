import { ipcMain } from "electron";
import {
    readAppSettings,
    saveAppSettings,
    AppSettings,
} from "../services/settings/appSettings";

export function registerSettingsIpc() {
    ipcMain.handle("settings:load", async () => {
        return readAppSettings();
    });

    ipcMain.handle("settings:save", async (_, settings: AppSettings) => {
        return saveAppSettings(settings);
    });
}