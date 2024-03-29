import "@fs-access/init"; // home directory initialization, must be first import
import { createServer } from "http";
import * as express from "express";
import * as cors from "cors";
import { Server } from "http";

import serverController from "@controllers/server";
import repoController from "@controllers/repo";
import healthController from "@controllers/health";
import authController from "@controllers/auth";
import logger, { closeLogger } from "@services/logger";
import { initServersJson } from "@fs-access/server";
import { errorToString } from "@utils/utils";
import { getConf } from "@fs-access/conf";
import { getRepo } from "@fs-access/repo";
import { getWebSocket } from "@services/socket";

let httpServer: Server | undefined;

(async () => {
  logger().info("Using node version " + process.version);

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

    // init servers and repo files
    initServersJson();
    await getRepo();

    // init configuration file
    const conf = getConf();

    // init http server
    httpServer = createServer();
    {
      // configure REST endpoint
      const app = express();
      app.use(cors());
      app.use("/health-check", healthController);
      app.use("/auth", authController);
      app.use("/servers", serverController);
      app.use("/repo", repoController);
      httpServer.on("request", app);

      // configure web socket
      httpServer.on("upgrade", function upgrade(request, socket, head) {
        const webSocket = getWebSocket();
        webSocket.handleUpgrade(request, socket, head, function done(ws) {
          webSocket.emit("connection", ws, request);
        });
      });

      // start http server
      const port = conf.endpointPort || 5000;
      httpServer.listen(port, () => {
        logger().info(`HTTP server listening at port ${port}`);
      });
    }

    // setup shutdown hook
    process.on("SIGTERM", () => {
      logger().info("SIGTERM received");
      shutdown();
    });

    logger().info("Craft-panel started");
  } catch (error) {
    logger().error("Error during application initialization: " + errorToString(error));
    shutdown();
  }
})();

async function shutdown() {
  logger().info("Shutdown...");
  if (httpServer) {
    httpServer.close();
  }
  closeLogger();
}
