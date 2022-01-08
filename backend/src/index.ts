import "@fs-access/init"; // home directory initialization, must be first import

import * as express from "express";
import * as cors from "cors";
import { Server } from "http";

import logger from "@services/logger";
import serverController from "@controllers/server";
import { initServersJson } from "@fs-access/server";
import { errorToString } from "@utils/utils";
import { getConf } from "@fs-access/conf";
import { getRepo } from "@fs-access/repo";

let server: Server | undefined;

(async () => {
  try {
    // setup unhandled exceptions handler (this event also catch unhandled rejections)
    process.on(
      "uncaughtException",
      async (error: unknown, origin: "uncaughtException" | "unhandledrejection ") => {
        try {
          console.error(errorToString(error));
          logger().error(errorToString(error));
          shutdown();
        } catch (e) {
          // ignore to not cause an infinite loop of unhandled exceptions / rejections
        }
      }
    );

    // init directories and files
    initServersJson();
    getConf();
    getRepo();

    // configure REST endpoint
    const app = express();
    app.use(cors());
    app.use("/servers", serverController);

    server = app.listen(process.env.CRAFT_PANEL_PORT, () => {
      logger().info(`REST endpoint listening at port ${process.env.CRAFT_PANEL_PORT}`);
    });

    // setup shutdown hook
    process.on("SIGTERM", () => {
      logger().info("SIGTERM received");
      shutdown();
    });

    logger().info("Craft-panel started");
  } catch (error) {
    console.log("Error during application initialization: " + errorToString(error));
    logger().error(errorToString(error));
    shutdown();
  }
})();

function shutdown() {
  if (server) {
    server.close();
  }
  setImmediate(() => process.exit(1));
}
