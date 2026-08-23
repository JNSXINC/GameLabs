import * as fs from "node:fs";
import * as path from "node:path";

export type ControllerSettings = {
    autoStartDS4: boolean;
    watchdogDS4: boolean;
    closeWithGameLabs: boolean;
    ds4Path: string;
};

export const defaultControllerSettings: ControllerSettings = {
    autoStartDS4: false,
    watchdogDS4: false,
    closeWithGameLabs: false,
    ds4Path: "",
};

export function getControllerSettingsPath() {
    return path.join(
        process.cwd(),
        "data",
        "preferences",
        "controllers.json"
    );
}

export function readControllerSettings(): ControllerSettings {
    try {
        const controllersPath = getControllerSettingsPath();

        if (!fs.existsSync(controllersPath)) {
            fs.mkdirSync(path.dirname(controllersPath), { recursive: true });

            fs.writeFileSync(
                controllersPath,
                JSON.stringify(defaultControllerSettings, null, 2)
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