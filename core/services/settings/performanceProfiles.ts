export type PerformancePreset =
    | "baixo"
    | "equilibrado"
    | "alto"
    | "ultra";

export type PerformanceProfile = {
    internalResolution: number;
    anisotropicFiltering: boolean;
    antiAliasing: boolean;
};

export const performanceProfiles: Record<
    PerformancePreset,
    PerformanceProfile
> = {
    baixo: {
        internalResolution: 1,
        anisotropicFiltering: false,
        antiAliasing: false,
    },

    equilibrado: {
        internalResolution: 2,
        anisotropicFiltering: true,
        antiAliasing: false,
    },

    alto: {
        internalResolution: 3,
        anisotropicFiltering: true,
        antiAliasing: true,
    },

    ultra: {
        internalResolution: 4,
        anisotropicFiltering: true,
        antiAliasing: true,
    },
};