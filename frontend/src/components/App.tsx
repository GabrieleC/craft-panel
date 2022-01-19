import { useCallback, useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, createTheme, Grid, ThemeProvider, useMediaQuery } from "@mui/material";
import useWebSocket from "react-use-websocket";

import { WorldsColumn } from "./WorldsColumn/WorldsColumn";
import grey from "@mui/material/colors/grey";
import { WorldScreen } from "./WorldScreen/WorldScreen";
import { useFetch } from "./hooks";
import { listServers } from "../services/server";

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL || "";

export default function App() {
  // theme
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
          secondary: grey,
        },
      }),
    [prefersDarkMode]
  );

  // listen for live refresh notifications from backend
  const { lastMessage } = useWebSocket("ws://" + baseUrl, {
    shouldReconnect: () => true,
  });
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.event === "servers-changed") {
        refreshServers();
      }
    }
  }, [lastMessage]);

  // fetch worlds list
  const fetcher = useFetch(listServers);
  const { data: servers, error: serversError, isLoading: serversLoading } = fetcher;

  // wrap trigger function to avoid refreshes too close each other
  const [lastRefreshTs, setLastRefreshTs] = useState(0);
  const refreshServers = () => {
    if (Date.now() > lastRefreshTs + 1000) {
      fetcher.trigger();
      setLastRefreshTs(Date.now());
    }
  };

  // handle selected world
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const onWorldSelected = (id: string) => {
    setSelectedWorldId(id);
  };

  const selectedServer = servers?.find((i) => i.id === selectedWorldId) || null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      <Grid container direction="row">
        <Grid
          item
          sx={{
            pt: 1,
            borderRight: 1,
            borderColor: theme.palette.divider,
          }}
          style={{ height: "100vh", overflowY: "scroll" }}
        >
          <WorldsColumn
            width="300px"
            onWorldSelected={onWorldSelected}
            onWorldChange={refreshServers}
            servers={servers}
            serversError={serversError}
            serversLoading={serversLoading}
          />
        </Grid>
        <Grid item xs sx={{ p: 3, pt: 2 }} style={{ height: "100vh", overflowY: "scroll" }}>
          {selectedServer && <WorldScreen server={selectedServer} onWorldChange={refreshServers} />}
          {!selectedServer && <Box sx={{ p: 2 }}>No world selected</Box>}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
