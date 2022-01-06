import { join } from "path";
import { existsSync, writeFileSync, readFileSync } from "fs";

import { resolveHomePath } from "@fs-access/common";

let conf: Conf | undefined;

export interface Conf {
  portsRange: [number, number];
  nextPort: number;
}

const defaultConf: Conf = {
  portsRange: [25565, 25665],
  nextPort: 25565,
};

export function resolveConfPath(): string {
  return join(resolveHomePath(), "conf.json");
}

export function initConf(): void {
  const confPath = resolveConfPath();

  if (!existsSync(confPath)) {
    writeFileSync(confPath, JSON.stringify(defaultConf, null, 4));
  }

  conf = JSON.parse(readFileSync(confPath).toString("utf-8")) as Conf;
}

export function getConf(): Conf {
  if (conf !== undefined) {
    return conf;
  } else {
    throw new Error("Conf not initialized");
  }
}
