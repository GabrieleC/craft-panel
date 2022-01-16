import { useEffect, useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { runCommand } from "../services/server";
import { useCall } from "./hooks";

export function CommandsConsole(props: { serverId: string }) {
  const [command, setCommand] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("");

  const { isCalling, call } = useCall(() => runCommand(props.serverId, command));

  // reset console on server change
  useEffect(() => {
    setCommand("op username");
    setLastResult("");
  }, [props.serverId]);

  const sendCommand = async () => {
    try {
      setLastResult((await call()) || "Command executed");
    } catch (error) {
      setLastResult("Error executing command");
    }
  };

  return (
    <Stack>
      <TextField
        multiline
        minRows={2}
        fullWidth
        disabled={isCalling}
        value={isCalling ? "Sending command..." : lastResult}
        InputProps={{ readOnly: true }}
      />
      <TextField
        fullWidth
        disabled={isCalling}
        size="small"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendCommand();
          }
        }}
        InputProps={{
          endAdornment: (
            <Button color="primary" onClick={sendCommand}>
              Send
            </Button>
          ),
        }}
      />
    </Stack>
  );
}
