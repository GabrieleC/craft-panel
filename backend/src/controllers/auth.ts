import { getConf } from "@fs-access/conf";
import { backendPassword } from "@services/auth";
import { mandatoryField } from "@utils/utils";
import { Router, json } from "express";

const router = Router();

router.use(json());

router.post("/login", (req, res) => {
  mandatoryField(req?.body?.user, "user");
  mandatoryField(req?.body?.password, "password");

  const userExists = getConf().users.includes(req.body.user);
  const passwordOk = Boolean(req?.body?.password === backendPassword());

  res.send(String(userExists && passwordOk));
});

export default router;
