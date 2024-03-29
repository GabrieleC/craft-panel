import { Logger, createLogManager } from "simple-node-logger";
import { existsSync, mkdirSync } from "fs";

import { resolveLogsDir } from "@fs-access/logs";

let log: Logger | undefined;
const manager = createLogManager();

export default function logger(): Logger {
  if (log === undefined) {
    // create logs directory if not exists
    const logsDir = resolveLogsDir();
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // initialize logger
    manager.createRollingFileAppender({
      logDirectory: resolveLogsDir(),
      fileNamePattern: "<DATE>.log",
      dateFormat: "YYYY-MM-DD",
    });

    log = manager.createLogger();
  }

  return log;
}

export function closeLogger() {
  manager.getAppenders().forEach((appender) => {
    if (appender.__protected) {
      let rollTimer = appender.__protected()["rollTimer"];
      if (rollTimer) {
        clearInterval(rollTimer);
      }
    }
  });
}
