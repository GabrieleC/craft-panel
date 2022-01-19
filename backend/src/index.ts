import "@fs-access/init"; // home directory initialization, must be first import
import { createServer } from "http";
import * as express from "express";
import * as cors from "cors";
import { Server } from "http";

import logger from "@services/logger";
import serverController from "@controllers/server";
import repoController from "@controllers/repo";
import { initServersJson } from "@fs-access/server";
import { errorToString } from "@utils/utils";
import { getConf } from "@fs-access/conf";
import { getRepo } from "@fs-access/repo";
import { getWebSocket } from "@services/socket";

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

    // init servers and repo files
    initServersJson();
    getRepo();

    // init configuration file
    const conf = getConf();

    // init http server
    {
      const httpServer = createServer();

      // configure REST endpoint
      const app = express();
      app.use(cors());
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

function shutdown() {
  if (server) {
    server.close();
  }
}
