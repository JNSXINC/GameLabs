import { dialog, ipcMain } from "electron";
import fs from "fs";
import path from "path";

const controllersPath = path.join(
    process.cwd(),
    "data",
    "preferences",
    "controllers.json"
);

const defaultSettings = {
    autoStartDS4: false,
    watchdogDS4: false,
    closeWithGameLabs: false,
    ds4Path: "",
};

export function registerControllersIpc() {
    ipcMain.handle("controllers:load", async () => {
        try {
            if (!fs.existsSync(controllersPath)) {
                fs.mkdirSync(path.dirname(controllersPath), { recursive: true });
                fs.writeFileSync(
                    controllersPath,
                    JSON.stringify(defaultSettings, null, 2)
                );

                return defaultSettings;
            }

            return JSON.parse(fs.readFileSync(controllersPath, "utf8"));
        } catch {
            return defaultSettings;
        }
    });

    ipcMain.handle("controllers:save", async (_, settings) => {
        fs.mkdirSync(path.dirname(controllersPath), { recursive: true });

        fs.writeFileSync(
            controllersPath,
            JSON.stringify(settings, null, 2)
        );

        return true;
    });

    ipcMain.handle("controllers:select-ds4", async () => {
        const result = await dialog.showOpenDialog({
            title: "Selecione o DS4Windows.exe",
            properties: ["openFile"],
            filters: [
                {
                    name: "DS4Windows",
                    extensions: ["exe"],
                },
            ],
        });

        if (result.canceled || !result.filePaths.length) {
            return {
                canceled: true,
                path: null,
            };
        }

        return {
            canceled: false,
            path: result.filePaths[0],
        };
    });
}