import { getServerByUuid, listServers } from "@data-access/server";
import { readServerProperties, Server, Servers, writeServerProperties } from "@fs-access/server";
import { listVersions } from "@services/repo";
import { Properties, Property } from "@utils/properties";
import { mandatoryField } from "@utils/utils";
import { Router, json } from "express";
import { businessErrorHandler } from "./commons";

const router = Router();

router.use(json());

router.get("/versions", (req, res) => {
  res.send(listVersions());
});

router.use(businessErrorHandler);

export default router;
