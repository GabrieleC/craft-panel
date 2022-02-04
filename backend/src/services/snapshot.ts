import { copyResources, mkSnapshotDir, snapshotExists } from "@fs-access/snapshot";
import { BusinessError } from "./common";
import { acquireServerLock } from "./locks";
import { serverIsRunning } from "./server";

export async function createSnapshot(uuid: string) {
  await acquireServerLock(uuid, async () => {
    // throw error if server is running
    if (await serverIsRunning(uuid)) {
      throw new BusinessError("Cannot create snapshot while server is running");
    }

    // determine snapshot timestamp
    const timestamp = String(Date.now());

    // throw error if snapshot already exists
    if (snapshotExists(uuid, timestamp)) {
      throw new Error("Cannot create an already existing snapshot");
    }

    // create snapshot dir
    mkSnapshotDir(uuid, timestamp);

    // define resources to be copied
    const dataResources = ["world", "usercache.json"];
    const confResources = [
      "eula.txt",
      "server.properties",
      "banned-ips.json",
      "banned-players.json",
      "whitelist.json",
      "ops.json",
    ];

    // copy resources in snapshot dir
    copyResources(uuid, timestamp, [...dataResources, ...confResources]);
  });
}
