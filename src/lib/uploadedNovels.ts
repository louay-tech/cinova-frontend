import type { Novel } from "./novels";

export type UploadedRecord = {
  novel: Novel;
  uploadedAt: number;
  lastPosition: number;
};

const KEY = "lumen.uploaded.novels.v2";
const LEGACY_KEY = "lumen.uploaded.novels";

function read(): Record<string, UploadedRecord> {
  if (typeof window === "undefined") return {};
  try {
    const map = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Migrate legacy plain-novel map
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      try {
        const old = JSON.parse(legacy) as Record<string, Novel>;
        for (const id of Object.keys(old)) {
          if (!map[id]) {
            map[id] = { novel: old[id], uploadedAt: Date.now(), lastPosition: 0 };
          }
        }
        localStorage.removeItem(LEGACY_KEY);
        localStorage.setItem(KEY, JSON.stringify(map));
      } catch {
        // ignore
      }
    }
    return map;
  } catch {
    return {};
  }
}

function write(map: Record<string, UploadedRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function saveUploadedNovel(novel: Novel) {
  const map = read();
  map[novel.id] = {
    novel,
    uploadedAt: map[novel.id]?.uploadedAt ?? Date.now(),
    lastPosition: map[novel.id]?.lastPosition ?? 0,
  };
  write(map);
}

export function getUploadedNovel(id: string): Novel | undefined {
  return read()[id]?.novel;
}

export function listUploadedNovels(): UploadedRecord[] {
  return Object.values(read()).sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export function deleteUploadedNovel(id: string) {
  const map = read();
  delete map[id];
  write(map);
}

export function setLastPosition(id: string, pos: number) {
  const map = read();
  if (map[id]) {
    map[id].lastPosition = pos;
    write(map);
  }
}

export function getLastPosition(id: string): number {
  return read()[id]?.lastPosition ?? 0;
}
