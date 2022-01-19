import { resolve } from "path";

const home = process.env.CRAFT_PANEL_HOME as string;

export function homePath(): string {
  return home;
}

export function resolveHomePath(): string {
  return resolve(home);
}
