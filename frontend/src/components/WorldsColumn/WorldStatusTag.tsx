import { ServerDTO } from "../../services/server";
import { Tag } from "../Tag";

export function WorldStatusTag(props: { server: ServerDTO }): JSX.Element {
  const { server } = props;
  if (server.status === "created" && server.stopping) {
    return <Tag label="Stopping" color="warning" />;
  } else if (server.status === "created" && server.online) {
    return <Tag label="Online" color="success" />;
  } else if (server.status === "created" && server.running) {
    return <Tag label="Running" color="warning" />;
  } else if (server.status === "created" && !server.running) {
    return <Tag label="Stopped" color="secondary" />;
  } else if (server.status === "creation_error") {
    return <Tag label="Error" color="error" />;
  } else if (server.status === "provisioning") {
    return <Tag label="Creating" color="warning" />;
  } else {
    return <Tag label="Unknown" color="warning" />;
  }
}
