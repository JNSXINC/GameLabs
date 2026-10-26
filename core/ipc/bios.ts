import { dialog, shell } from "electron";
import fs from "node:fs";
import path from "path";

import { registerSecureHandler } from "./secureIpc";
import { getGameLabsDataPath } from "../services/storage/appPaths";

import {
  loadBiosConfigs,
  updateBiosPath,
} from "../services/emulators/bios/biosManager";

import {
  getBiosRegionStatus,
  getBiosStatus,
} from "../services/emulators/bios/getBiosStatus";

import { BiosPlatform, BiosRegion } from "../services/emulators/bios/biosTypes";

export function registerBiosIpc() {
  registerSecureHandler("bios:list", async () => {
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

  registerSecureHandler(
    "bios:select",
    async (_, platform: BiosPlatform, region?: BiosRegion) => {
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
    },
  );

  registerSecureHandler("bios:open-folder", async (_, biosPath?: string) => {
    if (!biosPath) {
      const folder = path.join(getGameLabsDataPath(), "bios");

      await fs.promises.mkdir(folder, { recursive: true });

      await shell.openPath(folder);
      return;
    }

    await shell.openPath(path.dirname(biosPath));
  });
}
