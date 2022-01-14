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
