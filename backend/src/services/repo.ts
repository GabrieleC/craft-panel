import { getRepo } from "@fs-access/repo";
import { compareSemVer } from "@utils/utils";

export async function versionIsAvailable(version: string) {
  return (await getRepo())[version] !== undefined;
}

export async function compatibleJvm(version: string) {
  const jvmName = (await getRepo())[version];
  if (!jvmName) {
    throw new Error("Version " + version + "not available");
  }

  return jvmName;
}

export async function listVersions(): Promise<string[]> {
  return Object.keys(await getRepo());
}

let lastVersionCached = "";

export async function lastVersion(): Promise<string> {
  if (lastVersionCached === "") {
    // cache calculated last version to improve performance
    lastVersionCached = Object.keys(await getRepo()).reduce((previous, current) =>
      compareSemVer(previous, current) > 0 ? current : previous
    );
  }

  return lastVersionCached;
}
