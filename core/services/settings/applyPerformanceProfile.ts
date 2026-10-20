import { getPerformanceProfile } from "./getPerformanceProfile";
import {
  applyPerformanceTarget,
  PerformanceTarget,
} from "./performanceTargets";

export function applyPerformanceProfile(
  target: PerformanceTarget,
  executablePath?: string,
) {
  const profile = getPerformanceProfile();

  console.log(`[Performance] Aplicando perfil para ${target}:`, profile);

  return applyPerformanceTarget(target, profile, executablePath);
}
