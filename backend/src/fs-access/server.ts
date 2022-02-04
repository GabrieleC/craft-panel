import { join } from "path";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
  rmSync,
} from "fs";

import { Properties } from "@utils/properties";
import { resolveHomePath } from "@fs-access/common";
import { getJvmPath, getVersionPath } from "@fs-access/repo";
import { getServerByUuid } from "@data-access/server";

export interface Servers {
  nextPort: number;
  nextRconPort: number;
  instances: Server[];
}

export interface Server {
  uuid: string;
  name: string;
  version: string;
  note?: string;
  creationDate: Date;
  port: number;
  rconPort: number;
  status: "provisioning" | "created" | "creation_error" | "to_delete";
  errorMessage?: string;
  pid?: number;
  stopping: boolean;
}

export function initServersJson(): void {
  const serversDir = resolveServersDir();

  if (!existsSync(serversDir)) {
    mkdirSync(serversDir, { recursive: true });
  }

  const serversConfPath = resolveServersJsonPath();
  if (!existsSync(serversConfPath)) {
    writeFileSync(serversConfPath, "");
  }
}

export function serverDirExists(uuid: string) {
  return existsSync(resolveServerDir(uuid));
}

export function mkServerDir(uuid: string) {
  mkdirSync(resolveServerDir(uuid));
  mkdirSync(join(resolveServerDir(uuid), "logs"));
}

export function rmServerDir(uuid: string) {
  const serverDir = resolveServerDir(uuid);
  if (existsSync(serverDir)) {
    rmSync(serverDir, { recursive: true });
  }
}

export function linkExecutables(uuid: string, version: string, jvm: string) {
  const versionPath = getVersionPath(version);
  const jvmPath = getJvmPath(jvm);

  symlinkSync(versionPath, resolveJarPath(uuid), "file");
  symlinkSync(jvmPath, resolveServerJvmPath(uuid), "dir");
}

export function unlinkExecutables(uuid: string) {
  const versionLink = resolveJarPath(uuid);
  const jvmLink = resolveServerJvmPath(uuid);
  if (existsSync(versionLink)) {
    unlinkSync(versionLink);
  }
  if (existsSync(jvmLink)) {
    unlinkSync(jvmLink);
  }
}

export function cleanSupportResources(uuid: string) {
  const serverDir = resolveServerDir(uuid);

  for (const resource of ["libraries", "versions"]) {
    rmSync(join(serverDir, resource), { recursive: true, force: true });
  }
}

export function executablesPaths(uuid: string) {
  const serverDir = resolveServerDir(uuid);
  const serverJar = resolveJarPath(uuid);
  const jvmBinPath = resolveJvmBinPath(uuid);

  return {
    cwd: serverDir,
    jre: jvmBinPath,
    jar: serverJar,
  };
}

/* Read/write functions */

export function readServerProperties(uuid: string): Properties {
  return new Properties(readFileSync(resolveServerProperties(uuid)).toString("utf-8"));
}

export function writeServerProperties(uuid: string, value: Properties) {
  writeFileSync(resolveServerProperties(uuid), value.toString());
}

export function writeServerEula(uuid: string, value: Properties) {
  writeFileSync(resolveServerEula(uuid), value.toString());
}

export function readServerEula(uuid: string): Properties {
  return new Properties(readFileSync(resolveServerEula(uuid)).toString("utf-8"));
}

export function readServersJson(): Servers | undefined {
  const content = readFileSync(resolveServersJsonPath()).toString("utf-8");
  if (content == "") {
    return undefined;
  } else {
    return JSON.parse(content) as Servers;
  }
}

export function writeServersJson(data: Servers) {
  const json = JSON.stringify(data, null, 4);
  writeFileSync(resolveServersJsonPath(), json);
}

export function writeInitLog(uuid: string, log: string) {
  writeFileSync(resolveInitLog(uuid), log);
}

export function readInitLog(uuid: string): string | null {
  const logPath = resolveInitLog(uuid);
  return existsSync(logPath) ? readFileSync(logPath).toString("utf-8") : null;
}

export function getServerResourcesDir(uuid: string) {
  return resolveServerDir(uuid);
}

/* Path resolution functions (keep private) */

function resolveServersDir(): string {
  return join(resolveHomePath(), "servers");
}

function resolveServerDir(uuid: string): string {
  return join(resolveServersDir(), uuid);
}

function resolveServersJsonPath(): string {
  return join(resolveServersDir(), "servers.json");
}

function resolveServerProperties(uuid: string) {
  return join(resolveServerDir(uuid), "server.properties");
}

function resolveServerEula(uuid: string) {
  return join(resolveServerDir(uuid), "eula.txt");
}

function resolveInitLog(uuid: string) {
  return join(resolveServerDir(uuid), "logs", "init.log");
}

function resolveJarPath(uuid: string): string {
  return join(resolveServerDir(uuid), "server.jar");
}

function resolveServerJvmPath(uuid: string): string {
  return join(resolveServerDir(uuid), "jvm");
}

function resolveJvmBinPath(uuid: string): string {
  return resolveServerJvmPath(uuid) + "/bin/java";
}
