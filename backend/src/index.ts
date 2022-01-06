import * as express from "express";
import * as cors from "cors";

import logger, { startLogger } from "@services/logger";
import serverController from "@controllers/server";
import { initLogs } from "@fs-access/logs";
import { initHome } from "@fs-access/common";
import { initRepo } from "@fs-access/repo";
import { initConf } from "@fs-access/conf";
import { initServers } from "@fs-access/server";
import { initDb } from "@data-access/server";

async function init() {
  console.log("Starting craft-panel...");

  /* Init home dir */

  initHome();
  initLogs();
  startLogger(); // at this point we can start writing logs
  initRepo();
  initConf();
  initServers();

  await initDb(); // open servers json file

  /* Configure REST endpoint */

  const app = express();
  app.use(cors());
  app.use("/servers", serverController);

  app.listen(process.env.CRAFT_PANEL_PORT, () => {
    logger().info(`REST endpoint listening at port ${process.env.CRAFT_PANEL_PORT}`);
  });
}

init();
// TODO: handle errors in init
