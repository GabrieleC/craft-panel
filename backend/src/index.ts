import "@fs-access/init"; // home directory initialization, must be fist import

import * as express from "express";
import * as cors from "cors";

import logger from "@services/logger";
import serverController from "@controllers/server";
import { initServers } from "@fs-access/server";

async function init() {
  // init servers directory and db
  initServers();

  /* Configure REST endpoint */

  const app = express();
  app.use(cors());
  app.use("/servers", serverController);

  app.listen(process.env.CRAFT_PANEL_PORT, () => {
    logger().info(`REST endpoint listening at port ${process.env.CRAFT_PANEL_PORT}`);
  });

  logger().info("Craft-panel started");
}

try {
  init();
} catch (error) {
  console.log("Error during application initialization: " + error);
  process.exit(1);
}

// TODO: unhandled rejections
