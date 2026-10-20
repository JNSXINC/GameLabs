import { PerformanceProfile } from "./performanceProfiles";
import { applyPCSX2Config } from "../emulators/config/pcsx2Config";

export type PerformanceTarget =
  | "duckstation"
  | "pcsx2"
  | "ppsspp"
  | "dolphin"
  | "retroarch";

export function applyPerformanceTarget(
  target: PerformanceTarget,
  profile: PerformanceProfile,
  executablePath?: string,
) {
  console.log(`[Performance] Aplicando perfil em ${target}:`, profile);

  switch (target) {
    case "duckstation":
      return applyDuckStationProfile(profile);

    case "pcsx2":
      return applyPCSX2Profile(profile, executablePath);

    case "ppsspp":
      return applyPPSSPPProfile(profile);

    case "dolphin":
      return applyDolphinProfile(profile);

    case "retroarch":
      return applyRetroArchProfile(profile);
  }
}

function applyDuckStationProfile(profile: PerformanceProfile) {
  return profile;
}

function applyPCSX2Profile(
  profile: PerformanceProfile,
  executablePath?: string,
) {
  console.log("[PCSX2] Aplicando perfil automático:", profile);

  return applyPCSX2Config(profile, executablePath);
}

function applyPPSSPPProfile(profile: PerformanceProfile) {
  return profile;
}

function applyDolphinProfile(profile: PerformanceProfile) {
  return profile;
}

function applyRetroArchProfile(profile: PerformanceProfile) {
  return profile;
}
