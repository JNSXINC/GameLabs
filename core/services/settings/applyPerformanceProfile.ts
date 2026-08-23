import { getPerformanceProfile } from "./getPerformanceProfile";
import {
    applyPerformanceTarget,
    PerformanceTarget,
} from "./performanceTargets";

export function applyPerformanceProfile(
    target: PerformanceTarget
) {
    const profile = getPerformanceProfile();

    console.log(
        `Aplicando perfil de performance para ${target}:`,
        profile
    );

    return applyPerformanceTarget(
        target,
        profile
    );
}