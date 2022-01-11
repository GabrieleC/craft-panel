import { ServerDTO } from "../services/server";
import List from "@mui/material/List";
import { Card, CardContent, Chip, Typography, IconButton, Grid } from "@mui/material";
import PlayCircleOutlineOutlined from "@mui/icons-material/PlayCircleOutlineOutlined";
import StopCircleOutlined from "@mui/icons-material/StopCircleOutlined";

export function WorldsList(props: {
  worlds: ServerDTO[] | null;
  onPlay?: (id: string) => void;
  onStop?: (id: string) => void;
}) {
  let items = null;
  if (props.worlds !== null) {
    items = props.worlds.map((i) => (
      <WorldItem
        key={i.id}
        server={i}
        style={{ marginBottom: "5px" }}
        onPlay={props.onPlay}
        onStop={props.onStop}
      />
    ));
  }
  return <List>{items || "No worlds"}</List>;
}

function WorldItem(props: {
  server: ServerDTO;
  style?: React.CSSProperties;
  onPlay?: (id: string) => void;
  onStop?: (id: string) => void;
}) {
  const { server } = props;

  let statusChip;
  if (server.status === "created" && server.running) {
    statusChip = <Chip label="Running" variant="outlined" color="success" size="small" />;
  } else if (server.status === "created" && !server.running) {
    statusChip = <Chip label="Stopped" variant="outlined" color="secondary" size="small" />;
  } else if (server.status === "creation_error") {
    statusChip = <Chip label="Error" variant="outlined" color="error" size="small" />;
  } else {
    statusChip = <Chip label="Creating" variant="outlined" color="warning" size="small" />;
  }

  return (
    <Card style={props.style}>
      <CardContent>
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">{server.name}</Typography>
            {statusChip}
          </Grid>
          <Grid item>
            {server.running ? (
              <IconButton
                onClick={() => {
                  if (props.onStop) props.onStop(server.id);
                }}
              >
                <StopCircleOutlined fontSize="large" />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => {
                  if (props.onPlay) props.onPlay(server.id);
                }}
              >
                <PlayCircleOutlineOutlined fontSize="large" />
              </IconButton>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
