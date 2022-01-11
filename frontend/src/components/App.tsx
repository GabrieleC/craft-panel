import { useEffect, useState, useMemo, ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  Box,
  Button,
  createTheme,
  Grid,
  IconButton,
  Stack,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import { listServers, ServerDTO, startServer, stopServer } from "../services/server";
import { WorldsList } from "./WorldsList";

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
  const [servers, serversError] = useListServer(refreshServers);
  let worlds: ReactNode;
  if (serversError) {
    worlds = <span>{"Error while retrieving worlds list"}</span>;
  } else if (servers === null) {
    worlds = <span>{"Loading worlds..."}</span>;
  } else {
    worlds = <WorldsList worlds={servers} onPlay={onPlayWorld} onStop={onStopWorld} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CraftPanelAppBar />

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
            <IconButton>
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

function useListServer(refresh: number): [ServerDTO[] | null, boolean] {
  const [servers, setServers] = useState<ServerDTO[] | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setServers(null);
    (async () => {
      try {
        setServers(await listServers());
        setError(false);
      } catch (error) {
        setError(true);
      }
    })();
  }, [refresh]);

  return [servers, error];
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
