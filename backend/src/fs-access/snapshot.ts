import { join } from "path";
import { mkdirSync, cpSync, existsSync } from "fs";
import { resolveHomePath } from "@fs-access/common";
import { getServerResourcesDir } from "@fs-access/server";

export function mkSnapshotDir(uuid: string, timestamp: string) {
  mkdirSync(resolveSnapshotDir(uuid, timestamp), { recursive: true });
}

export function snapshotExists(uuid: string, timestamp: string) {
  return existsSync(resolveSnapshotDir(uuid, timestamp));
}

export function copyResources(uuid: string, timestamp: string, resources: string[]) {
  const sourceDir = getServerResourcesDir(uuid);
  const targetDir = resolveSnapshotDir(uuid, timestamp);

  for (const resource of resources) {
    const source = join(sourceDir, resource);
    if (existsSync(source)) {
      cpSync(source, join(targetDir, resource), { recursive: true });
    }
  }
}

/* Path resolution functions (keep private) */

function resolveSnapshotsDir(): string {
  return join(resolveHomePath(), "snapshots");
}

function resolveSnapshotDir(uuid: string, timestamp: string): string {
  return join(resolveSnapshotsDir(), uuid, timestamp);
}
