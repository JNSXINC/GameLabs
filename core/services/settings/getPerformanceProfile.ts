import { readAppSettings } from "./appSettings";
import { performanceProfiles } from "./performanceProfiles";

export function getPerformanceProfile() {
    const settings = readAppSettings();

    return (
        performanceProfiles[
        settings.performancePreset
        ] || performanceProfiles.equilibrado
    );
}