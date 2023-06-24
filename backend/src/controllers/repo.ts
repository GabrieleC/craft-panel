import { lastVersion, listVersions } from "@services/repo";
import { Router, json } from "express";
import * as asyncHandler from "express-async-handler";
import { basicAuthHandler, businessErrorHandler } from "@controllers/commons";

const router = Router();

router.use(basicAuthHandler);
router.use(json());

router.get(
  "/versions",
  asyncHandler(async (req, res) => {
    res.send(await listVersions());
  })
);

router.get(
  "/last-version",
  asyncHandler(async (req, res) => {
    res.send(await lastVersion());
  })
);

router.use(businessErrorHandler);

export default router;
