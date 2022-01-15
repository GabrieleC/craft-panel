import { ReactNode, useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import { listServers, ServerDTO, startServer, stopServer } from "../services/server";
import { WorldsList } from "./WorldsList";
import { useFetch } from "./hooks";
import { CreateWorldDialog } from "./CreateWorldDialog";

export function WorldsColumn(props: {
  width?: string;
  onWorldSelected?: (id: string) => void;
  onWorldChange?: () => void;
  servers: ServerDTO[] | null;
  serversError: boolean;
  serversLoading: boolean;
}) {
  const { servers, serversError, serversLoading } = props;
  const onWorldChange = props.onWorldChange || (() => {});

  const onPlayWorld = async (id: string) => {
    startServer(id);
    onWorldChange();
  };

  const onStopWorld = async (id: string) => {
    stopServer(id);
    onWorldChange();
  };

  const onClickWorld = async (id: string) => {
    if (props.onWorldSelected) {
      props.onWorldSelected(id);
    }
  };

  // render worlds
  let message: ReactNode | null = null;
  if (serversLoading) {
    message = <Typography>{"Loading worlds..."}</Typography>;
  } else if (serversError) {
    message = <Typography>{"Error while retrieving worlds list"}</Typography>;
  } else if (servers !== null && servers.length === 0) {
    message = <Typography>No worlds</Typography>;
  }

  // create world dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const onCreateDialogFinish = (created: boolean) => {
    setCreateDialogOpen(false);
    if (created) {
      onWorldChange();
    }
  };

  return (
    <Box style={{ width: props.width }}>
      {createDialogOpen && <CreateWorldDialog onFinish={onCreateDialogFinish} />}
      <Stack spacing={1} direction="row">
        <IconButton onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </IconButton>
        <IconButton onClick={onWorldChange}>
          <ReplayIcon />
        </IconButton>
      </Stack>
      {message}
      <WorldsList
        worlds={serversLoading || serversError ? null : servers}
        onPlay={onPlayWorld}
        onStop={onStopWorld}
        onClick={onClickWorld}
      />
    </Box>
  );
}
