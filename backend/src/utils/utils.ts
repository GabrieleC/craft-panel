import { getServerByUuid } from "@data-access/server";
import { BusinessError } from "@services/common";
import { defaultMaxListeners } from "ws";

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

export function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function mandatoryField(value: string, name: unknown) {
  if (value === undefined || value === null || value === "") {
    throw new BusinessError("Mandatory field: " + name);
  }
}

export function checkServerExists(uuid: string) {
  const server = getServerByUuid(uuid);
  if (!server) {
    throw new BusinessError("No server found for uuid: " + uuid);
  }
}

export function compareSemVer(left: string, right: string) {
  const leftSplit = left.split(".");
  const rightSplit = right.split(".");

  for (let i = 0; i < Math.max(leftSplit.length, rightSplit.length); i++) {
    if (leftSplit[i] !== rightSplit[i]) {
      return Number(rightSplit[i] || 0) - Number(leftSplit[i] || 0);
    }
  }

  return 0;
}
