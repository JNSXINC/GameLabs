/// <reference types="vite/client" />

type ControllerSettingsData = {
    autoStartDS4: boolean;
    watchdogDS4: boolean;
    closeWithGameLabs: boolean;
    ds4Path: string;
};

interface Window {
    electronAPI: {
        loadControllerSettings: () => Promise<ControllerSettingsData>;

        saveControllerSettings: (
            settings: ControllerSettingsData
        ) => Promise<boolean>;

        selectDS4Executable: () => Promise<{
            canceled: boolean;
            path: string | null;
        }>;

        [key: string]: any;
    };
}