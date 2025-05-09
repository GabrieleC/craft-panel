import { join } from "path";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
  rmSync,
  readdirSync,
  lstatSync,
} from "fs";

import { Properties } from "@utils/properties";
import { resolveHomePath } from "@fs-access/common";
import { getJvmPath, getVersionPath } from "@fs-access/repo";
import { log } from "console";
import { linkDirContent } from "@utils/utils";

export interface Servers {
  nextPort: number;
  nextRconPort: number;
  instances: Server[];
}

export interface Server {
  uuid: string;
  name: string;
  version: string;
  owner: string;
  seed?: string;
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
  linkJvm(uuid, jvm);
  linkServerExecutables(uuid, version);
}

function linkServerExecutables(uuid: string, version: string) {
  const serverExecPath = getVersionPath(version);

  if (lstatSync(serverExecPath).isFile()) {
    symlinkSync(serverExecPath, resolveJarPath(uuid), "file");
  } else {
    linkDirContent(serverExecPath, resolveServerDir(uuid));
  }
}

function linkJvm(uuid: string, jvm: string) {
  const jvmPath = getJvmPath(jvm);
  symlinkSync(jvmPath, resolveServerJvmPath(uuid), "dir");
}

export function unlinkExecutables(uuid: string, version: string) {
  unlinkServerExecutables(uuid, version);
  unlinkJvm(uuid);
}

function unlinkServerExecutables(uuid: string, version: string) {
  const repoExecutablePath = getVersionPath(version);

  if (lstatSync(repoExecutablePath).isFile()) {
    const versionLink = resolveJarPath(uuid);
    if (existsSync(versionLink)) {
      unlinkSync(versionLink);
    }  
  } else {
    const filenameList = readdirSync(repoExecutablePath);
    const serverDir = resolveServerDir(uuid);
    for (const filename of filenameList) {
      const filePath = join(serverDir, filename);
      if (existsSync(filePath) && lstatSync(filePath).isSymbolicLink()) {
        unlinkSync(filePath);
      }
    }
  }
}

function unlinkJvm(uuid: string) {
  const jvmLink = resolveServerJvmPath(uuid);
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

export function getServerDatapacksList(uuid: string): string[] {
  const datapacksDir = resolveDatapacksDir(uuid);
  if (existsSync(datapacksDir)) {
    return readdirSync(datapacksDir);
  } else {
    return [];
  }
}

export function deleteDatapackFile(uuid: string, datapackName: string) {
  const path = resolveDatapackPath(uuid, datapackName);
  unlinkSync(path);
}

export function getServerModsList(uuid: string): string[] {
  const dir = resolveModsDir(uuid);
  if (existsSync(dir)) {
    return readdirSync(dir);
  } else {
    return [];
  }
}

export function deleteModFile(uuid: string, datapackName: string) {
  const path = resolveModPath(uuid, datapackName);
  unlinkSync(path);
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

function resolveWorldDir(uuid: string): string {
  return join(resolveServerDir(uuid), "world");
}

export function resolveDatapacksDir(uuid: string): string {
  return join(resolveWorldDir(uuid), "datapacks");
}

export function resolveDatapackPath(uuid: string, datapackName: string): string {
  return join(resolveDatapacksDir(uuid), datapackName);
}

export function resolveModsDir(uuid: string): string {
  return join(resolveServerDir(uuid), "mods");
}

export function resolveModPath(uuid: string, modName: string): string {
  return join(resolveModsDir(uuid), modName);
}