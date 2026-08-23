import { PerformanceProfile } from "./performanceProfiles";

export type PerformanceTarget =
    | "duckstation"
    | "pcsx2"
    | "ppsspp"
    | "dolphin"
    | "retroarch";

export function applyPerformanceTarget(
    target: PerformanceTarget,
    profile: PerformanceProfile
) {
    console.log(
        `[Performance] Aplicando perfil em ${target}:`,
        profile
    );

    switch (target) {
        case "duckstation":
            return applyDuckStationProfile(profile);

        case "pcsx2":
            return applyPCSX2Profile(profile);

        case "ppsspp":
            return applyPPSSPPProfile(profile);

        case "dolphin":
            return applyDolphinProfile(profile);

        case "retroarch":
            return applyRetroArchProfile(profile);
    }
}

function applyDuckStationProfile(
    profile: PerformanceProfile
) {
    return profile;
}

function applyPCSX2Profile(
    profile: PerformanceProfile
) {
    return profile;
}

function applyPPSSPPProfile(
    profile: PerformanceProfile
) {
    return profile;
}

function applyDolphinProfile(
    profile: PerformanceProfile
) {
    return profile;
}

function applyRetroArchProfile(
    profile: PerformanceProfile
) {
    return profile;
}