export type BiosPlatform =
    | "ps1"
    | "ps2"
    | "psp"
    | "gamecube"
    | "wii"
    | "retroarch";

export type BiosRegion =
    | "usa"
    | "japan"
    | "europe";

export type BiosStatus =
    | "configured"
    | "partial"
    | "missing"
    | "not_required";

export interface BiosRegionConfig {
    region: BiosRegion;
    name: string;
    biosHint?: string;
    path?: string;
    status?: "configured" | "missing";
}

export interface BiosConfig {
    platform: BiosPlatform;
    name: string;
    required: boolean;
    path?: string;
    regions?: BiosRegionConfig[];
}