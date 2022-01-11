import { listVersions } from "@services/repo";
import { Router, json } from "express";
import { businessErrorHandler } from "./commons";

const router = Router();

router.use(json());

router.get("/versions", (req, res) => {
  res.send(listVersions());
});

router.use(businessErrorHandler);

export default router;
