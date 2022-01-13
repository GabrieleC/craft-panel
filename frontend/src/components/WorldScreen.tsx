import { useCallback } from "react";
import Typography from "@mui/material/Typography";
import { Button, Container, Stack } from "@mui/material";
import { getServer } from "../services/server";
import { useFetch } from "./hooks";
import ReplayIcon from "@mui/icons-material/Replay";
import { PlayArrow, Stop } from "@mui/icons-material";

export function WorldScreen(props: { id: string }) {
  const {
    data: server,
    error: fetchError,
    isLoading,
    trigger: refreshServer,
  } = useFetch(useCallback(() => getServer(props.id), [props.id]));

  if (isLoading || server === null) {
    return <span>Loading...</span>;
  } else if (fetchError) {
    return <Typography>An error occurred while retrieving world information</Typography>;
  } else {
    return (
      <Container>
        <Stack spacing={1} direction="row" sx={{ mb: 2, mt: 1 }}>
          <Button variant="contained" size="small">
            <ReplayIcon />
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={server.instance === "running" || server.instance === "stopping"}
          >
            <PlayArrow /> Start
          </Button>
          <Button variant="contained" size="small" disabled={server.instance === "stopped"}>
            <Stop /> Stop
          </Button>
        </Stack>
        <Typography variant="h5">{server.name}</Typography>
        <Typography fontSize={10} variant="caption">
          {props.id}
        </Typography>
        <Typography variant="body1">Minecraft version: {server.version}</Typography>
      </Container>
    );
  }
}
