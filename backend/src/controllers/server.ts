import { createServer } from "@services/server";
import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  // const uuid = await createServer();
  // res.send(uuid);
});

export default router;
