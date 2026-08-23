import fs from "fs";
import path from "path";
import {
    BiosConfig,
    BiosPlatform,
    BiosRegion,
} from "./biosTypes";
import { getBiosStatus } from "./getBiosStatus";

const BIOS_FILE = path.join(
    process.cwd(),
    "data",
    "preferences",
    "bios.json"
);

const PS1_REGIONS = [
    {
        region: "usa" as BiosRegion,
        name: "USA",
        biosHint: "SCPH-1001",
    },
    {
        region: "japan" as BiosRegion,
        name: "JAP",
        biosHint: "SCPH-5500",
    },
    {
        region: "europe" as BiosRegion,
        name: "EUR",
        biosHint: "SCPH-7502",
    },
];

const PS2_REGIONS = [
    {
        region: "usa" as BiosRegion,
        name: "USA",
        biosHint: "SCPH-39001",
    },
    {
        region: "japan" as BiosRegion,
        name: "JAP",
        biosHint: "SCPH-10000",
    },
    {
        region: "europe" as BiosRegion,
        name: "EUR",
        biosHint: "SCPH-50004",
    },
];

const DEFAULT_BIOS: BiosConfig[] = [
    {
        platform: "ps1",
        name: "PlayStation 1",
        required: true,
        regions: PS1_REGIONS,
    },
    {
        platform: "ps2",
        name: "PlayStation 2",
        required: true,
        regions: PS2_REGIONS,
    },
    {
        platform: "psp",
        name: "PSP",
        required: false,
    },
    {
        platform: "gamecube",
        name: "GameCube",
        required: false,
    },
    {
        platform: "wii",
        name: "Nintendo Wii",
        required: false,
    },
    {
        platform: "retroarch",
        name: "RetroArch",
        required: false,
    },
];

export function loadBiosConfigs(): BiosConfig[] {
    if (!fs.existsSync(BIOS_FILE)) {
        return DEFAULT_BIOS;
    }

    try {
        return JSON.parse(fs.readFileSync(BIOS_FILE, "utf-8"));
    } catch {
        return DEFAULT_BIOS;
    }
}

export function saveBiosConfigs(configs: BiosConfig[]) {
    fs.mkdirSync(path.dirname(BIOS_FILE), {
        recursive: true,
    });

    fs.writeFileSync(
        BIOS_FILE,
        JSON.stringify(configs, null, 2)
    );
}

export function updateBiosPath(
    platform: BiosPlatform,
    biosPath: string,
    region?: BiosRegion
) {
    const configs = loadBiosConfigs();

    const bios = configs.find(
        (item) => item.platform === platform
    );

    if (!bios) return;

    if (region && bios.regions) {
        const targetRegion = bios.regions.find(
            (item) => item.region === region
        );

        if (!targetRegion) return;

        targetRegion.path = biosPath;
    } else {
        bios.path = biosPath;
    }

    saveBiosConfigs(configs);
}

export function isBiosConfigured(platform: BiosPlatform) {
    const bios = loadBiosConfigs().find(
        (item) => item.platform === platform
    );

    if (!bios) return false;

    return getBiosStatus(bios) === "configured";
}