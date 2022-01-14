import { ServerDTO } from "../services/server";
import List from "@mui/material/List";
import {
  Card,
  CardContent,
  Chip,
  Typography,
  IconButton,
  Grid,
  ListItem,
  Divider,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import PlayCircleOutlineOutlined from "@mui/icons-material/PlayCircleOutlineOutlined";
import StopCircleOutlined from "@mui/icons-material/StopCircleOutlined";
import { useState } from "react";
import { useTheme } from "@emotion/react";
import { WorldStatusTag } from "./WorldStatusTag";

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
      <>
        <Divider variant="fullWidth" />
        <WorldItem
          server={i}
          selected={i.id === selectedId}
          onPlay={props.onPlay}
          onStop={props.onStop}
          onClick={(id) => {
            setSelectedId(id);
            if (id && props.onClick) {
              props.onClick(id);
            }
          }}
        />
      </>
    ));
  }
  return <List sx={{ width: "100%", bgcolor: "background.paper" }}>{items}</List>;
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

  let button;
  if (server.running) {
    button = (
      <IconButton
        disabled={server.stopping}
        onClick={() => {
          if (props.onStop) props.onStop(server.id);
        }}
      >
        <StopCircleOutlined fontSize="large" />
      </IconButton>
    );
  } else {
    button = (
      <IconButton
        disabled={server.status !== "created"}
        onClick={() => {
          if (props.onPlay) props.onPlay(server.id);
        }}
      >
        <PlayCircleOutlineOutlined fontSize="large" />
      </IconButton>
    );
  }

  return (
    <ListItem
      key={server.id}
      disablePadding
      onClick={() => {
        if (props.onClick) {
          props.onClick(server.id);
        }
      }}
      secondaryAction={button}
    >
      <ListItemButton>
        <ListItemText
          primary={server.name}
          primaryTypographyProps={{ variant: "h6" }}
          secondary={<WorldStatusTag server={server} />}
        />
      </ListItemButton>
    </ListItem>
  );
}
