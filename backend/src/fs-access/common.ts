import { resolve } from "path";

export function resolveHomePath(): string {
  return resolve(process.env.CRAFT_PANEL_HOME as string);
}
