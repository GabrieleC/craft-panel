import { getRepo } from "@fs-access/repo";
import { compareSemVer } from "@utils/utils";

export function versionIsAvailable(version: string) {
  return getRepo()[version] !== undefined;
}

export function compatibleJvm(version: string) {
  const jvmName = getRepo()[version];
  if (!jvmName) {
    throw new Error("Version " + version + "not available");
  }

  return jvmName;
}

export function listVersions(): string[] {
  return Object.keys(getRepo());
}

let lastVersionCached = "";

export function lastVersion(): string {
  if (lastVersionCached === "") {
    // cache calculated last version to improve performance
    lastVersionCached = Object.keys(getRepo()).reduce((previous, current) =>
      compareSemVer(previous, current) > 0 ? current : previous
    );
  }

  return lastVersionCached;
}
