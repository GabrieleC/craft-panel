import { existsSync } from "fs";
import { resolve } from "path";

export function resolveHomePath(): string {
  return resolve(process.env.CRAFT_PANEL_HOME as string);
}

export function initHome() {
  const homePath = resolveHomePath();
  console.log("Home path: " + homePath);

  if (homePath === "" || !existsSync(homePath)) {
    throw new Error("HOME dir not set or not existent");
  }
}
