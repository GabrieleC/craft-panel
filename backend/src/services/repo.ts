import { getRepo } from "@fs-access/repo";

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
