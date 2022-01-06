import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import { resolveHomePath } from "@fs-access/common";

export function resolveServersDir(): string {
  return join(resolveHomePath(), "servers");
}

export function resolveServersJsonPath(): string {
  return join(resolveServersDir(), "servers.json");
}

export function initServers(): void {
  const serversDir = resolveServersDir();

  if (!existsSync(serversDir)) {
    mkdirSync(serversDir, { recursive: true });
  }

  const serversConfPath = resolveServersJsonPath();
  if (!existsSync(serversConfPath)) {
    writeFileSync(serversConfPath, JSON.stringify([]));
  }
}
