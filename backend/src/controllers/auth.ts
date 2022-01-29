import { backendPassword } from "@services/auth";
import { Router, json } from "express";

const router = Router();

router.use(json());

router.post("/login", (req, res) => {
  res.send(String(Boolean(req?.body?.password === backendPassword())));
});

export default router;
