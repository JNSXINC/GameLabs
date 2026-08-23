import https from "https";

function getHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(
                url,
                {
                    headers: {
                        "User-Agent": "GameLabs",
                    },
                },
                (response) => {
                    let data = "";

                    response.on("data", (chunk) => {
                        data += chunk;
                    });

                    response.on("end", () => {
                        resolve(data);
                    });
                }
            )
            .on("error", reject);
    });
}

function normalizeDolphinUrl(href: string) {
    if (href.startsWith("https://")) {
        return href;
    }

    if (href.startsWith("//")) {
        return `https:${href}`;
    }

    if (href.startsWith("/")) {
        return `https://dolphin-emu.org${href}`;
    }

    return `https://dolphin-emu.org/${href}`;
}

export async function resolveDolphinLatestUrl(): Promise<string> {
    const html = await getHtml("https://dolphin-emu.org/download/");

    const links = Array.from(
        html.matchAll(/href="([^"]+)"/gi)
    ).map((match) => match[1]);

    const windowsX64Link = links.find((href) => {
        const lower = href.toLowerCase();

        return (
            lower.includes("dl.dolphin-emu.org") &&
            lower.includes("windows") &&
            lower.includes("x64")
        );
    });

    if (!windowsX64Link) {
        console.log("[Dolphin Resolver] Links encontrados:", links);

        throw new Error(
            "Não foi possível encontrar download Windows x64 do Dolphin."
        );
    }

    return normalizeDolphinUrl(windowsX64Link);
}