import { ServerDTO } from "../services/server";
import List from "@mui/material/List";
import { Card, CardContent, Chip, Typography, IconButton, Grid } from "@mui/material";
import PlayCircleOutlineOutlined from "@mui/icons-material/PlayCircleOutlineOutlined";
import StopCircleOutlined from "@mui/icons-material/StopCircleOutlined";
import { useState } from "react";

export function WorldsList(props: {
  worlds: ServerDTO[] | null;
  onPlay?: (id: string) => void;
  onStop?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  let items = null;
  if (props.worlds !== null) {
    items = props.worlds.map((i) => (
      <WorldItem
        key={i.id}
        server={i}
        selected={i.id === selectedId}
        style={{ marginBottom: "5px" }}
        onPlay={props.onPlay}
        onStop={props.onStop}
        onClick={(id) => {
          setSelectedId(id);
          if (id && props.onClick) {
            props.onClick(id);
          }
        }}
      />
    ));
  }
  return <List>{items}</List>;
}

function WorldItem(props: {
  server: ServerDTO;
  selected: boolean;
  style?: React.CSSProperties;
  onPlay?: (id: string) => void;
  onStop?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  const { server } = props;

  let statusChip;
  if (server.status === "created" && server.instance === "running") {
    statusChip = <Chip label="Running" variant="outlined" color="success" size="small" />;
  } else if (server.status === "created" && server.instance === "stopped") {
    statusChip = <Chip label="Stopped" variant="outlined" color="secondary" size="small" />;
  } else if (server.status === "created" && server.instance === "stopping") {
    statusChip = <Chip label="Stopping" variant="outlined" color="warning" size="small" />;
  } else if (server.status === "creation_error") {
    statusChip = <Chip label="Error" variant="outlined" color="error" size="small" />;
  } else {
    statusChip = <Chip label="Creating" variant="outlined" color="warning" size="small" />;
  }

  return (
    <Card
      style={props.style}
      onClick={() => {
        if (props.onClick) {
          props.onClick(props.server.id);
        }
      }}
    >
      <CardContent>
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">{server.name}</Typography>
            {statusChip}
          </Grid>
          <Grid item>
            {server.instance === "running" || server.instance === "stopping" ? (
              <IconButton
                disabled={server.instance === "stopping"}
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
