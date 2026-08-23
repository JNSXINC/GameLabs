export function resolveStaticUrl(url: string) {
    if (!url) {
        throw new Error("URL estática não configurada.");
    }

    return url;
}