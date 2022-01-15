import { useMemo, useState } from "react";
import "./App.css";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, createTheme, Grid, ThemeProvider, useMediaQuery } from "@mui/material";
import { WorldsColumn } from "./WorldsColumn";
import grey from "@mui/material/colors/grey";
import { WorldScreen } from "./WorldScreen";
import { useFetch } from "./hooks";
import { listServers } from "../services/server";

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

  // fetch worlds list
  const {
    data: servers,
    error: serversError,
    isLoading: serversLoading,
    trigger: refreshServers,
  } = useFetch(listServers);

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
