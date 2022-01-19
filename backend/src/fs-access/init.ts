import { existsSync } from "fs";
import { homePath, resolveHomePath } from "@fs-access/common";

const path = homePath();

if (path === "" || !existsSync(path)) {
  console.log("Configured home path: " + path);
  throw new Error("home dir not set or not existent");
} else {
  console.log("Home path: " + resolveHomePath());
}
