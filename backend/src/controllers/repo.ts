import { listVersions } from "@services/repo";
import { Router, json } from "express";
import * as asyncHandler from "express-async-handler";
import { basicAuthHandler, businessErrorHandler } from "@controllers/commons";
import { getConf } from "@fs-access/conf";

const router = Router();

router.use(json());

router.use(basicAuthHandler);

router.get(
  "/versions",
  asyncHandler((req, res) => {
    res.send(listVersions());
  })
);

router.get(
  "/last-version",
  asyncHandler((req, res) => {
    res.send(getConf().defaultVersion);
  })
);

router.use(businessErrorHandler);

export default router;
