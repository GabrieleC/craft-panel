import { useState, useMemo, ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { createTheme, Grid, IconButton, Stack, ThemeProvider, useMediaQuery } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import { startServer, stopServer } from "../services/server";
import { WorldsList } from "./WorldsList";
import { useListServers } from "./hooks";
import { CreateWorldDialog } from "./CreateWorldDialog";

export default function App() {
  // theme
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

  // start and stop worlds
  const onPlayWorld = async (id: string) => {
    startServer(id);
    setRefreshServers(Date.now());
  };

  const onStopWorld = async (id: string) => {
    stopServer(id);
    setRefreshServers(Date.now());
  };

  // worlds list
  const [refreshServers, setRefreshServers] = useState<number>(Date.now());
  const [servers, serversError] = useListServers(refreshServers);
  let worlds: ReactNode;
  if (serversError) {
    worlds = <span>{"Error while retrieving worlds list"}</span>;
  } else if (servers === null) {
    worlds = <span>{"Loading worlds..."}</span>;
  } else {
    worlds = <WorldsList worlds={servers} onPlay={onPlayWorld} onStop={onStopWorld} />;
  }

  // create world dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CraftPanelAppBar />
      {createDialogOpen && <CreateWorldDialog onFinish={() => setCreateDialogOpen(false)} />}
      <Grid container style={{ height: "100vh" }}>
        <Grid
          sx={{ p: 1, borderRight: 1, borderColor: theme.palette.divider }}
          item
          style={{
            width: "300px",
          }}
        >
          <Toolbar />
          <Stack spacing={1} direction="row">
            <IconButton onClick={() => setCreateDialogOpen(true)}>
              <AddIcon />
            </IconButton>
            <IconButton onClick={() => setRefreshServers(Date.now())}>
              <ReplayIcon />
            </IconButton>
          </Stack>
          {worlds}
        </Grid>
        <Grid item xs>
          <Toolbar />2
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

function CraftPanelAppBar() {
  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Craft Panel
          </Typography>
        </Toolbar>
      </AppBar>
    </>
  );
}
