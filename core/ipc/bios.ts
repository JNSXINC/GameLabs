import { ipcMain, dialog, shell } from "electron";
import path from "path";
import {
    loadBiosConfigs,
    updateBiosPath,
} from "../services/emulators/bios/biosManager";
import {
    getBiosRegionStatus,
    getBiosStatus,
} from "../services/emulators/bios/getBiosStatus";
import {
    BiosPlatform,
    BiosRegion,
} from "../services/emulators/bios/biosTypes";

export function registerBiosIpc() {
    ipcMain.handle("bios:list", async () => {
        const configs = loadBiosConfigs();

        return configs.map((bios) => ({
            ...bios,
            status: getBiosStatus(bios),
            regions: bios.regions?.map((region) => ({
                ...region,
                status: getBiosRegionStatus(region),
            })),
        }));
    });

    ipcMain.handle(
        "bios:select",
        async (
            _,
            platform: BiosPlatform,
            region?: BiosRegion
        ) => {
            const result = await dialog.showOpenDialog({
                title: "Selecionar BIOS",
                properties: ["openFile"],
                filters: [
                    {
                        name: "BIOS",
                        extensions: ["bin", "rom", "iso", "cue"],
                    },
                    {
                        name: "Todos os arquivos",
                        extensions: ["*"],
                    },
                ],
            });

            if (result.canceled || result.filePaths.length === 0) {
                return null;
            }

            const biosPath = result.filePaths[0];

            updateBiosPath(platform, biosPath, region);

            return biosPath;
        }
    );

    ipcMain.handle("bios:open-folder", async (_, biosPath?: string) => {
        if (!biosPath) {
            const folder = path.join(process.cwd(), "data", "bios");
            await shell.openPath(folder);
            return;
        }

        await shell.openPath(path.dirname(biosPath));
    });
}