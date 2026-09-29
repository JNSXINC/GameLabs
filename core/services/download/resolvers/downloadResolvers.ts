export type DownloadResolverType = "static" | "github_latest" | "manual";

export type DownloadResolverConfig = {
  type: DownloadResolverType;
  url?: string;
  owner?: string;
  repo?: string;
  assetIncludes?: string[];
  assetExcludes?: string[];
};
