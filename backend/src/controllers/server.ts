import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  res.send("Hello World!");
});

export default router;
