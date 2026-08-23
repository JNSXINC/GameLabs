export type EmulatorArchiveType = "zip" | "exe" | "7z";

import { DownloadResolverConfig } from "./resolvers/downloadResolvers";

export type DownloadableEmulator = {
    id: string;
    name: string;
    installFolder: string;
    archiveType: EmulatorArchiveType;
    executableCandidates: string[];
    resolver: DownloadResolverConfig;
};

export const emulatorDownloads: DownloadableEmulator[] = [
    {
        id: "duckstation",
        name: "DuckStation",
        installFolder: "Emulators/DuckStation",
        archiveType: "zip",
        executableCandidates: [
            "duckstation-qt-x64-ReleaseLTCG.exe"
        ],
        resolver: {
            type: "github_latest",
            owner: "stenzek",
            repo: "duckstation",
            assetIncludes: [
                "windows",
                "x64",
                "zip"
            ],
        },
    },
    {
        id: "pcsx2",
        name: "PCSX2",
        installFolder: "Emulators/PCSX2",
        archiveType: "7z",
        executableCandidates: [
            "pcsx2-qt.exe"
        ],
        resolver: {
            type: "github_latest",
            owner: "PCSX2",
            repo: "pcsx2",
            assetIncludes: [
                "windows",
                "x64",
                "qt",
                "7z"
            ],
            assetExcludes: [
                "symbols"
            ]
        },
    },
    {
        id: "ppsspp",
        name: "PPSSPP",
        installFolder: "Emulators/PPSSPP",
        archiveType: "zip",
        executableCandidates: [
            "PPSSPPWindows64.exe"
        ],
        resolver: {
            type: "github_latest",
            owner: "hrydgard",
            repo: "ppsspp",
            assetIncludes: [
                "windows",
                "x64",
                "zip"
            ],
        },
    },
    {
        id: "dolphin",
        name: "Dolphin",
        installFolder: "Emulators/Dolphin",
        archiveType: "7z",
        executableCandidates: [
            "Dolphin.exe"
        ],
        resolver: {
            type: "manual"
        }
    },
    {
        id: "retroarch",
        name: "RetroArch",
        installFolder: "Emulators/RetroArch",
        archiveType: "7z",
        executableCandidates: [
            "retroarch.exe"
        ],
        resolver: {
            type: "static",
            url: "https://buildbot.libretro.com/nightly/windows/x86_64/RetroArch.7z",
        },
    },

];