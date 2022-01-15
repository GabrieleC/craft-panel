import { ReactNode, useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import { listServers, startServer, stopServer } from "../services/server";
import { WorldsList } from "./WorldsList";
import { useFetch } from "./hooks";
import { CreateWorldDialog } from "./CreateWorldDialog";

export function WorldsColumn(props: { width?: string; onWorldSelected?: (id: string) => void }) {
  const onPlayWorld = async (id: string) => {
    startServer(id);
    refreshServers();
  };

  const onStopWorld = async (id: string) => {
    stopServer(id);
    refreshServers();
  };

  const onClickWorld = async (id: string) => {
    if (props.onWorldSelected) {
      props.onWorldSelected(id);
    }
  };

  // fetch worlds list
  const {
    data: servers,
    error: serversError,
    isLoading: serversLoading,
    trigger: refreshServers,
  } = useFetch(listServers);

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
      refreshServers();
    }
  };

  return (
    <Box style={{ width: props.width }}>
      {createDialogOpen && <CreateWorldDialog onFinish={onCreateDialogFinish} />}
      <Stack spacing={1} direction="row">
        <IconButton onClick={() => setCreateDialogOpen(true)}>
          <AddIcon />
        </IconButton>
        <IconButton onClick={refreshServers}>
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
