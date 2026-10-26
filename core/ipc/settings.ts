import { registerSecureHandler } from "./secureIpc";

import {
  readAppSettings,
  saveAppSettings,
  AppSettings,
} from "../services/settings/appSettings";

export function registerSettingsIpc() {
  registerSecureHandler("settings:load", async () => {
    return readAppSettings();
  });

  registerSecureHandler("settings:save", async (_, settings: AppSettings) => {
    return saveAppSettings(settings);
  });
}
