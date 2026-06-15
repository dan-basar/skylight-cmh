// FAA Releasable Aircraft Database lookup: N-number -> registered owner name.
// Downloads the weekly zip from the FAA, streams MASTER.txt out of it, builds
// a compact in-memory map, and persists a small JSON cache so restarts are
// instant. Refresh runs in the background; lookups are always synchronous and
// return undefined gracefully while the database is loading or unavailable.

import { createReadStream, createWriteStream } from "node:fs";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";

const FAA_ZIP_URL = "https://registry.faa.gov/database/ReleasableAircraft.zip";
const STALE_MS = 7 * 24 * 3600_000;

export class FaaLookup {
  private byReg = new Map<string, string>(); // "N12345AB" → owner name
  private loadedAt = 0;
  private readonly compactPath: string;
  private readonly zipPath: string;

  constructor(private dataDir: string) {
    this.compactPath = resolve(dataDir, "faa-registry.json");
    this.zipPath = resolve(dataDir, "faa-master.zip");
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.compactPath, "utf8");
      const parsed = JSON.parse(raw) as { at: number; reg: Record<string, string> };
      this.byReg = new Map(Object.entries(parsed.reg ?? {}));
      this.loadedAt = parsed.at ?? 0;
      console.log(`[faa] loaded ${this.byReg.size.toLocaleString()} records from cache`);
    } catch {
      /* first run — cache doesn't exist yet */
    }

    if (Date.now() - this.loadedAt > STALE_MS) {
      void this.refresh();
    }
    // Re-check weekly (even if the initial load was fresh).
    setInterval(() => void this.refresh(), STALE_MS).unref?.();
  }

  /** Synchronous, non-blocking. Returns undefined if not yet loaded or not found. */
  lookupOwner(registration: string | undefined): string | undefined {
    if (!registration) return undefined;
    return this.byReg.get(registration.toUpperCase().trim());
  }

  private async refresh(): Promise<void> {
    try {
      console.log("[faa] downloading FAA aircraft registry...");
      await mkdir(this.dataDir, { recursive: true });

      const res = await fetch(FAA_ZIP_URL, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await pipeline(res.body as any, createWriteStream(this.zipPath));

      const newMap = await parseMasterFromZip(this.zipPath);
      if (newMap.size === 0) throw new Error("parsed 0 records — aborting cache write");

      const reg: Record<string, string> = {};
      for (const [k, v] of newMap) reg[k] = v;
      await writeFile(this.compactPath, JSON.stringify({ at: Date.now(), reg }), "utf8");
      await unlink(this.zipPath).catch(() => {});

      this.byReg = newMap;
      this.loadedAt = Date.now();
      console.log(`[faa] refreshed ${newMap.size.toLocaleString()} records`);
    } catch (err) {
      console.error(
        "[faa] refresh failed (using cache):",
        err instanceof Error ? err.message : err,
      );
      // Clean up a partial zip download so we don't leave a corrupt file.
      await unlink(this.zipPath).catch(() => {});
    }
  }
}

async function parseMasterFromZip(zipPath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const zip = createReadStream(zipPath).pipe(unzipper.Parse({ forceStream: true }));

  for await (const entry of zip as AsyncIterable<unzipper.Entry>) {
    if (entry.path !== "MASTER.txt") {
      entry.autodrain();
      continue;
    }

    const rl = createInterface({ input: entry, crlfDelay: Infinity });
    let nNumIdx = -1;
    let nameIdx = -1;
    let firstLine = true;

    for await (const line of rl) {
      const cols = line.split(",");
      if (firstLine) {
        // Resolve column positions from the header so format changes don't break us.
        nNumIdx = cols.findIndex((c) => c.trim() === "N-NUMBER");
        nameIdx = cols.findIndex((c) => c.trim() === "NAME");
        firstLine = false;
        if (nNumIdx < 0 || nameIdx < 0) {
          console.error("[faa] MASTER.txt header missing expected columns");
          break;
        }
        continue;
      }
      const nNum = cols[nNumIdx]?.trim();
      const name = cols[nameIdx]?.trim();
      if (nNum && name) {
        // Store with the "N" prefix so lookups match ac.registration directly.
        map.set("N" + nNum.toUpperCase(), name);
      }
    }
    break;
  }

  return map;
}
