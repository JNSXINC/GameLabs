import https from "https";

type GithubAsset = {
    name: string;
    browser_download_url: string;
};

type GithubRelease = {
    assets: GithubAsset[];
};

function getJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        https.get(
            url,
            {
                headers: {
                    "User-Agent": "GameLabs",
                    Accept: "application/vnd.github+json",
                },
            },
            (response) => {
                let data = "";

                response.on("data", (chunk) => {
                    data += chunk;
                });

                response.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        ).on("error", reject);
    });
}

export async function resolveGithubLatestReleaseUrl(params: {
    owner: string;
    repo: string;
    assetIncludes: string[];
    assetExcludes?: string[];
}) {
    const release = await getJson<GithubRelease>(
        `https://api.github.com/repos/${params.owner}/${params.repo}/releases/latest`
    );

    const asset = release.assets.find((item) => {
        const name = item.name.toLowerCase();

        const includesMatch = params.assetIncludes.every((value) =>
            name.includes(value.toLowerCase())
        );

        const excluded =
            params.assetExcludes?.some((value) =>
                name.includes(value.toLowerCase())
            ) ?? false;

        return includesMatch && !excluded;
    });

    if (!asset) {
        throw new Error(
            `Nenhum asset compatível encontrado para ${params.owner}/${params.repo}.`
        );
    }

    return asset.browser_download_url;
}