import { join } from "path";
import { existsSync } from "fs";
import { mkdir, writeFile, readFile } from "fs/promises";

import { resolveHomePath } from "@fs-access/common";
import { fileExistsAsync, fileExistsSync } from "tsconfig-paths/lib/filesystem";

export interface Repo {
  [keys: string]: string;
}

let repo: Repo | undefined;

export async function getRepo(): Promise<Repo> {
  if (repo === undefined) {
    const repoDir = resolveRepoDir();

    if (!existsSync(repoDir)) {
      await mkdir(repoDir, { recursive: true });
    }

    const repoConfPath = resolveRepoConfPath();
    if (!existsSync(repoConfPath)) {
      await writeFile(repoConfPath, JSON.stringify({}));
      repo = {};
    } else {
      repo = JSON.parse((await readFile(repoConfPath)).toString()) as Repo;
    }
  }

  return repo;
}

export function getVersionPath(version: string): string {
  const jarPath = resolveVersionJarPath(version);
  if (fileExistsSync(jarPath)) {
    return jarPath;
  } else {
    return resolveVersionDirPath(version);
  }
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

function resolveVersionJarPath(version: string): string {
  return join(resolveRepoDir(), "server-" + version + ".jar");
}

function resolveVersionDirPath(version: string): string {
  return join(resolveRepoDir(), "server-" + version);
}

function resolveJvmPath(jvm: string): string {
  return join(resolveRepoDir(), jvm);
}
