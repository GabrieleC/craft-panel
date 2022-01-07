import { join } from "path";

import { resolveHomePath } from "@fs-access/common";

export function resolveLogsDir(): string {
  return join(resolveHomePath(), "logs");
}
