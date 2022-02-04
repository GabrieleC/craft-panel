import * as AsyncLock from "async-lock";

const serverLock = new AsyncLock();
export async function acquireServerLock<T>(uuid: string, cb: () => T) {
  return serverLock.acquire(uuid, cb);
}
