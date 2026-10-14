import * as fs from "node:fs";
import * as path from "node:path";
import { getPreferenceFilePath } from "../storage/appPaths";

export type PerformancePreset = "baixo" | "equilibrado" | "alto" | "ultra";

export type AppSettings = {
  performancePreset: PerformancePreset;
  autoDetectHardware: boolean;
};

export const defaultAppSettings: AppSettings = {
  performancePreset: "equilibrado",
  autoDetectHardware: true,
};

export function getAppSettingsPath(): string {
  return getPreferenceFilePath("settings.json");
}

export function readAppSettings(): AppSettings {
  try {
    const settingsPath = getAppSettingsPath();

    if (!fs.existsSync(settingsPath)) {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

      fs.writeFileSync(
        settingsPath,
        JSON.stringify(defaultAppSettings, null, 2),
      );

      return defaultAppSettings;
    }

    return {
      ...defaultAppSettings,
      ...JSON.parse(fs.readFileSync(settingsPath, "utf8")),
    };
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(settings: AppSettings): AppSettings {
  const settingsPath = getAppSettingsPath();

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  return settings;
}
