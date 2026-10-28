import * as fs from "node:fs";
import * as path from "node:path";
import { getPreferenceFilePath } from "../storage/appPaths";

export type ControllerSettings = {
  autoStartDS4: boolean;
  watchdogDS4: boolean;
  closeWithGameLabs: boolean;
  ds4Path: string;
  inputDevice: "keyboard1" | "keyboard2" | "controller";
};

export const defaultControllerSettings: ControllerSettings = {
  autoStartDS4: false,
  watchdogDS4: false,
  closeWithGameLabs: false,
  ds4Path: "",
  inputDevice: "keyboard1",
};

export function getControllerSettingsPath(): string {
  return getPreferenceFilePath("controllers.json");
}

export function readControllerSettings(): ControllerSettings {
  try {
    const controllersPath = getControllerSettingsPath();

    if (!fs.existsSync(controllersPath)) {
      fs.mkdirSync(path.dirname(controllersPath), { recursive: true });

      fs.writeFileSync(
        controllersPath,
        JSON.stringify(defaultControllerSettings, null, 2),
      );

      return defaultControllerSettings;
    }

    return {
      ...defaultControllerSettings,
      ...JSON.parse(fs.readFileSync(controllersPath, "utf8")),
    };
  } catch {
    return defaultControllerSettings;
  }
}

export function saveControllerSettings(
  settings: ControllerSettings,
): ControllerSettings {
  const controllersPath = getControllerSettingsPath();

  fs.mkdirSync(path.dirname(controllersPath), {
    recursive: true,
  });

  fs.writeFileSync(controllersPath, JSON.stringify(settings, null, 2));

  return settings;
}
