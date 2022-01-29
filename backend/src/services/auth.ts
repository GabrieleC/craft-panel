import { getConf } from "@fs-access/conf";

export function backendPassword() {
  return getConf().backendPassword;
}
