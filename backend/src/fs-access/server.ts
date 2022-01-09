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
import { execFile, spawn } from "child_process";
import { promisify } from "util";

import { Properties } from "@utils/properties";
import { resolveHomePath } from "@fs-access/common";
import { getJvmPath, getVersionPath } from "@fs-access/repo";
import logger from "@services/logger";
import { getServerByUuid } from "@data-access/server";

export interface Servers {
  nextPort: number;
  instances: Server[];
}

export interface Server {
  uuid: string;
  name: string;
  version: string;
  note?: string;
  creationDate: Date;
  port: number;
  status: "provisioning" | "created" | "creation_error" | "deleting" | "deleted";
  errorMessage?: string;
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
  mkdirSync(join(resolveServerDir(uuid), "_meta"));
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

export async function executeServerInit(uuid: string): Promise<string> {
  const serverDir = resolveServerDir(uuid);
  const serverJar = resolveJarPath(uuid);
  const jvmBinPath = resolveJvmBinPath(uuid);

  logger().info("Executing initialization for server uuid: " + uuid);
  const exec = await promisify(execFile)(jvmBinPath, ["-jar", serverJar, "--initSettings"], {
    windowsHide: true,
    cwd: serverDir,
  });
  logger().info("Initialization completed for server uuid: " + uuid);

  return exec.stdout;
}

export function executeServer(uuid: string): number {
  const server = getServerByUuid(uuid);

  const serverDir = resolveServerDir(uuid);
  const serverJar = resolveJarPath(uuid);
  const jvmBinPath = resolveJvmBinPath(uuid);

  logger().info("Launching server uuid: " + uuid);
  const exec = spawn(jvmBinPath, ["-jar", serverJar, "--nogui", "--port", String(server.port)], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    cwd: serverDir,
  });
  logger().info("Server launched, uuid: " + uuid + ", pid: " + exec.pid);

  if (exec.pid === undefined) {
    // should not happen, in case kill immediately to avoid a zombie process
    exec.kill("SIGKILL");
    throw new Error("Error launching server, empty pid! uuid = " + uuid);
  }

  return exec.pid;
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

export function writePidFile(uuid: string, pid: number) {
  writeFileSync(resolvePidFile(uuid), String(pid));
}

export function deletePidFile(uuid: string) {
  rmSync(resolvePidFile(uuid));
}

export function readPidFile(uuid: string): number | undefined {
  const pidFile = resolvePidFile(uuid);
  if (existsSync(pidFile)) {
    return Number(readFileSync(pidFile).toString("utf-8"));
  } else {
    return undefined;
  }
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

function resolveMetaDir(uuid: string) {
  return join(resolveServerDir(uuid), "_meta");
}

function resolveServerProperties(uuid: string) {
  return join(resolveServerDir(uuid), "server.properties");
}

function resolveServerEula(uuid: string) {
  return join(resolveServerDir(uuid), "eula.txt");
}

function resolveInitLog(uuid: string) {
  return join(resolveMetaDir(uuid), "init.log");
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

function resolvePidFile(uuid: string): string {
  return join(resolveMetaDir(uuid), "pid");
}
