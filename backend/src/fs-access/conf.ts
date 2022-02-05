import { join } from "path";
import { existsSync, writeFileSync, readFileSync } from "fs";

import { resolveHomePath } from "@fs-access/common";

export interface Conf {
  backendPassword: string;
  endpointPort: number;
  portsRange: [number, number];
  rconPortsRange: [number, number];
}

let conf: Conf | undefined;

const defaultConf: Conf = {
  backendPassword: "changeme",
  endpointPort: 5000,
  portsRange: [25565, 25664],
  rconPortsRange: [25665, 25764],
};

function resolveConfPath(): string {
  return join(resolveHomePath(), "conf.json");
}

export function getConf(): Conf {
  if (conf === undefined) {
    const confPath = resolveConfPath();

    if (!existsSync(confPath)) {
      writeFileSync(confPath, JSON.stringify(defaultConf, null, 4));
    }

    conf = JSON.parse(readFileSync(confPath).toString("utf-8")) as Conf;
  }

  return conf;
}
