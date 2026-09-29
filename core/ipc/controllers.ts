import { dialog, ipcMain } from "electron";
import fs from "fs";
import path from "path";

import { setupDS4Windows } from "../services/controls/ds4Download";
import {
  checkDS4Dependencies,
  ensureDS4Dependencies,
} from "../services/controls/ds4Dependencies";

const controllersPath = path.join(
  process.cwd(),
  "data",
  "preferences",
  "controllers.json",
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
          JSON.stringify(defaultSettings, null, 2),
        );

        return defaultSettings;
      }

      return JSON.parse(fs.readFileSync(controllersPath, "utf8"));
    } catch {
      return defaultSettings;
    }
  });

  ipcMain.handle("controllers:setup-ds4", async (event) => {
    return setupDS4Windows((progress) => {
      event.sender.send("controllers:ds4-download-progress", progress);
    });
  });

  ipcMain.handle("controllers:save", async (_, settings) => {
    fs.mkdirSync(path.dirname(controllersPath), { recursive: true });

    fs.writeFileSync(controllersPath, JSON.stringify(settings, null, 2));

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

  ipcMain.handle("controllers:check-ds4-dependencies", async () => {
    return checkDS4Dependencies();
  });
}

ipcMain.handle("controllers:ensure-ds4-dependencies", async () => {
  return ensureDS4Dependencies();
});
