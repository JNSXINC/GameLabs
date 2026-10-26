import { dialog } from "electron";
import { registerSecureHandler } from "./secureIpc";

import { setupDS4Windows } from "../services/controls/ds4Download";

import {
  checkDS4Dependencies,
  ensureDS4Dependencies,
} from "../services/controls/ds4Dependencies";

import {
  readControllerSettings,
  saveControllerSettings,
} from "../services/controls/controllerSettings";

export function registerControllersIpc() {
  registerSecureHandler("controllers:load", async () => {
    return readControllerSettings();
  });

  registerSecureHandler("controllers:setup-ds4", async (event) => {
    return setupDS4Windows((progress) => {
      event.sender.send("controllers:ds4-download-progress", progress);
    });
  });

  registerSecureHandler("controllers:save", async (_, settings) => {
    saveControllerSettings(settings);
    return true;
  });

  registerSecureHandler("controllers:select-ds4", async () => {
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

  registerSecureHandler("controllers:check-ds4-dependencies", async () => {
    return checkDS4Dependencies();
  });

  registerSecureHandler("controllers:ensure-ds4-dependencies", async () => {
    return ensureDS4Dependencies();
  });
}
