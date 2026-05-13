export function normalizeGameName(fileName: string): string {
    const withoutExtension = fileName.replace(/\.exe$/i, "");

    return withoutExtension
        .replace(/[_\-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}