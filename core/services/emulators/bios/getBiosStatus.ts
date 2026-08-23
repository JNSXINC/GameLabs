import fs from "fs";
import { BiosConfig, BiosRegionConfig } from "./biosTypes";

export function getBiosRegionStatus(
    region: BiosRegionConfig
): "configured" | "missing" {
    if (region.path && fs.existsSync(region.path)) {
        return "configured";
    }

    return "missing";
}

export function getBiosStatus(
    bios: BiosConfig
): "configured" | "partial" | "missing" | "not_required" {
    if (!bios.required) {
        return "not_required";
    }

    if (bios.regions && bios.regions.length > 0) {
        const statuses = bios.regions.map(getBiosRegionStatus);

        if (statuses.every((status) => status === "configured")) {
            return "configured";
        }

        if (statuses.some((status) => status === "configured")) {
            return "partial";
        }

        return "missing";
    }

    if (bios.path && fs.existsSync(bios.path)) {
        return "configured";
    }

    return "missing";
}