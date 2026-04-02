import fs from "fs";
import path from "path";

export const toPublicUploadPath = (filePath: string) => {
    const normalized = filePath.replace(/\\/g, "/");
    const marker = "/uploads/";
    const markerIndex = normalized.lastIndexOf(marker);

    if (markerIndex >= 0) {
        return normalized.slice(markerIndex);
    }

    const fallbackMarker = "uploads/";
    const fallbackIndex = normalized.lastIndexOf(fallbackMarker);
    if (fallbackIndex >= 0) {
        return `/${normalized.slice(fallbackIndex)}`;
    }

    return normalized;
};

export const deleteLocalUploadIfExists = async (storedPath?: string | null) => {
    if (!storedPath || !storedPath.startsWith("/uploads/")) {
        return;
    }

    const relativePath = storedPath.replace(/^\/+/, "");
    const absolutePath = path.join(__dirname, "..", relativePath);

    try {
        await fs.promises.unlink(absolutePath);
    }
    catch (error: any) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};
