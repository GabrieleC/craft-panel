import { existsSync } from "fs";
import { homePath } from "@fs-access/common";

const home = homePath();
console.log("Home path: " + home);

if (home === "" || !existsSync(home)) {
  throw new Error("home dir not set or not existent");
}
