import React from "react";
import { ServerDTO } from "../../services/server";
import List from "@mui/material/List";
import { IconButton, ListItem, Divider, ListItemText, ListItemButton } from "@mui/material";
import PlayCircleOutlineOutlined from "@mui/icons-material/PlayCircleOutlineOutlined";
import StopCircleOutlined from "@mui/icons-material/StopCircleOutlined";
import { useState } from "react";
import { WorldStatusTag } from "./WorldStatusTag";

export function WorldsList(props: {
  worlds: ServerDTO[] | null;
  onPlay?: (id: string) => void;
  onStop?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // sort running server first
  const worlds = props.worlds?.sort((a, b) => Number(b.running) - Number(a.running));

  return (
    <List>
      {worlds?.map((server) => (
        <React.Fragment key={server.id}>
          <Divider variant="fullWidth" />
          <WorldItem
            server={server}
            selected={server.id === selectedId}
            onPlay={props.onPlay}
            onStop={props.onStop}
            onClick={(id) => {
              setSelectedId(id);
              if (id && props.onClick) {
                props.onClick(id);
              }
            }}
          />
        </React.Fragment>
      ))}
    </List>
  );
}

function WorldItem(props: {
  server: ServerDTO;
  selected: boolean;
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
      disablePadding
      selected={props.selected}
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
