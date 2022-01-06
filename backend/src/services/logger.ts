import { resolveLogsDir } from "@fs-access/logs";
import { Logger, createRollingFileLogger } from "simple-node-logger";

let log: Logger | undefined;

export function startLogger() {
  log = createRollingFileLogger({
    logDirectory: resolveLogsDir(),
    fileNamePattern: "<DATE>.log",
    dateFormat: "YYYY.MM.DD",
  });
}

export default function logger(): Logger {
  if (log !== undefined) {
    return log;
  } else {
    throw new Error("Logger not already initialized");
  }
}
