import { join } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";

import { resolveHomePath } from "@fs-access/common";

export interface Repo {
  [keys: string]: string;
}

let repo: Repo | undefined;

export function getRepo(): Repo {
  if (repo === undefined) {
    const repoDir = resolveRepoDir();

    if (!existsSync(repoDir)) {
      mkdirSync(repoDir, { recursive: true });
    }

    const repoConfPath = resolveRepoConfPath();
    if (!existsSync(repoConfPath)) {
      writeFileSync(repoConfPath, JSON.stringify({}));
      repo = {};
    } else {
      repo = JSON.parse(readFileSync(repoConfPath).toString("utf-8")) as Repo;
    }
  }

  return repo;
}

export function getVersionPath(version: string): string {
  return resolveVersionPath(version);
}

export function getJvmPath(jvm: string): string {
  return resolveJvmPath(jvm);
}

/* Path resolution functions */

function resolveRepoDir(): string {
  return join(resolveHomePath(), "repository");
}

function resolveRepoConfPath(): string {
  return join(resolveRepoDir(), "repo.json");
}

function resolveVersionPath(version: string): string {
  return join(resolveRepoDir(), "server-" + version + ".jar");
}

function resolveJvmPath(jvm: string): string {
  return join(resolveRepoDir(), jvm);
}
