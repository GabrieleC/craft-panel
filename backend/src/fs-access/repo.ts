import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import { resolveHomePath } from "@fs-access/common";

export function resolveRepoDir(): string {
  return join(resolveHomePath(), "repository");
}

function resolveRepoConfPath(): string {
  return join(resolveRepoDir(), "repo.json");
}

export function initRepo(): void {
  const repoDir = resolveRepoDir();

  if (!existsSync(repoDir)) {
    mkdirSync(repoDir, { recursive: true });
  }

  const repoConfPath = resolveRepoConfPath();
  if (!existsSync(repoConfPath)) {
    writeFileSync(repoConfPath, JSON.stringify([]));
  }
}
