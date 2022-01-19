import { errorToString } from "@utils/utils";
import { WebSocketServer } from "ws";
import logger from "@services/logger";

const webSocket = new WebSocketServer({ noServer: true });

export function getWebSocket() {
  return webSocket;
}

export function notifyServersChanged() {
  webSocket.clients.forEach((client) => {
    try {
      client.send(JSON.stringify({ event: "servers-changed" }));
    } catch (error) {
      logger().warn("Error notifying WebSocket client: " + errorToString(error));
    }
  });
}
