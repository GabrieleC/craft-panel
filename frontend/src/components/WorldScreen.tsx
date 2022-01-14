import { useCallback } from "react";
import Typography from "@mui/material/Typography";
import { Button, Container, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { getServer } from "../services/server";
import { useFetch } from "./hooks";
import ReplayIcon from "@mui/icons-material/Replay";
import { ContentCopy, PlayArrow, Stop } from "@mui/icons-material";
import { WorldStatusTag } from "./WorldStatusTag";
import { Box } from "@mui/system";

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
          <Button variant="contained" size="small" disabled={server.stopping}>
            <PlayArrow /> Start
          </Button>
          <Button variant="contained" size="small" disabled={!server.running}>
            <Stop /> Stop
          </Button>
          <Button variant="contained" size="small" disabled={!server.stopping}>
            <Stop /> Force stop
          </Button>
        </Stack>
        <Typography variant="h5">{server.name}</Typography>
        <Box>
          <WorldStatusTag server={server} />
        </Box>
        <Typography fontSize={10} variant="caption">
          {props.id}
        </Typography>

        <TextField
          label="Notes"
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          value={server.note}
          style={{ display: "block" }}
        ></TextField>

        <TextField
          label="Minecraft version"
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          value={server.version}
          style={{ display: "block" }}
          InputProps={{
            readOnly: true,
          }}
        ></TextField>

        <TextField
          label="Connection URL"
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          value={"abc.def:" + server.port}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end">
                  <ContentCopy />
                </IconButton>
              </InputAdornment>
            ),
          }}
        ></TextField>
      </Container>
    );
  }
}
