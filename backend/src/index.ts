import { config as dotenvConfig } from "dotenv";
import * as express from "express";
import * as cors from "cors";
import serverController from "@controllers/server";

dotenvConfig();
console.log("Starting craft-panel...");

const app = express();
app.use(cors());
app.use(serverController);

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
