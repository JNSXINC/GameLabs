import crypto from "crypto";

export function hashGame(value: string): string {
    return crypto.createHash("md5").update(value).digest("hex");
}