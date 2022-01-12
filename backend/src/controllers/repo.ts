import { listVersions } from "@services/repo";
import { Router, json } from "express";
import * as asyncHandler from "express-async-handler";
import { businessErrorHandler } from "./commons";

const router = Router();

router.use(json());

router.get(
  "/versions",
  asyncHandler((req, res) => {
    res.send(listVersions());
  })
);

router.use(businessErrorHandler);

export default router;
