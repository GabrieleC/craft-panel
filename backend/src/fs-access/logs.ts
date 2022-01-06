import { join } from "path";
import { existsSync, mkdirSync } from "fs";

import { resolveHomePath } from "@fs-access/common";

export function resolveLogsDir(): string {
  return join(resolveHomePath(), "logs");
}

export function initLogs(): void {
  const logsDir = resolveLogsDir();

  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
}
