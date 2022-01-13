import { readlink } from "fs";
import { promisify } from "util";
import { BusinessError } from "@services/common";

export function clone<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return String(error.stack);
  } else {
    return JSON.stringify(error);
  }
}

export async function processExists(pid: number, exePath: string): Promise<boolean> {
  try {
    // this throws an error if pid doesn't exist
    process.kill(pid, 0);
  } catch (error) {
    return false;
  }

  if (process.platform === "linux") {
    const pidPath = await promisify(readlink)("/proc/" + pid + "/exe");
    return pidPath === exePath;
  } else {
    return true;
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function mandatoryField(value: string, name: unknown) {
  if (value === undefined || value === null || value === "") {
    throw new BusinessError("Mandatory field: " + name);
  }
}
