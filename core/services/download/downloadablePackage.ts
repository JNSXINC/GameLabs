import { DownloadResolverConfig } from "./resolvers/downloadResolvers";

export type DownloadArchiveType = "zip" | "exe" | "7z";

export type DownloadablePackage = {
  id: string;
  name: string;
  installFolder: string;
  archiveType: DownloadArchiveType;
  executableCandidates: string[];
  resolver: DownloadResolverConfig;
};
