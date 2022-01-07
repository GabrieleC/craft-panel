import { existsSync } from "fs";
import { resolveHomePath } from "@fs-access/common";

const homePath = resolveHomePath();
console.log("Home path: " + homePath);

if (homePath === "" || !existsSync(homePath)) {
  throw new Error("home dir not set or not existent");
}
