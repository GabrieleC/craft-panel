import * as cron from "node-cron";
import * as AsyncLock from "async-lock";
import { listServers } from "@data-access/server";
import { cleanupStoppedServers } from "@services/server";
import logger from "@services/logger";

// concurrency-safe lock for start/stop operations
const lock = new AsyncLock();
const stopMonitorLockKey = "stop-monitor";

const stopMonitor = cron.schedule(
  "*/5 * * * * *",
  async () => {
    logger().info("Running stop monitor...");
    await cleanupStoppedServers();

    // stop to monitor in case no servers are currently stopping
    lock.acquire(stopMonitorLockKey, () => {
      const servers = listServers().filter((i) => i.stopping);
      if (servers.length === 0) {
        stopMonitor.stop();
      }
    });
  },
  { scheduled: false }
);

export function triggerStopMonitor() {
  lock.acquire(stopMonitorLockKey, () => {
    stopMonitor.start();
  });
}
