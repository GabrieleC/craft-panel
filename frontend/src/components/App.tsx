import { useCallback, useMemo, useState } from "react";
import "./App.css";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  Container,
  createTheme,
  Grid,
  IconButton,
  Stack,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import { WorldsColumn } from "./WorldsColumn";
import { getServer } from "../services/server";
import { useFetch } from "./hooks";
import ReplayIcon from "@mui/icons-material/Replay";

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

  // handle selected world
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const onWorldSelected = (id: string) => {
    setSelectedWorldId(id);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      <Grid container direction="row">
        <Grid
          item
          sx={{
            p: 1,
            borderRight: 1,
            borderColor: theme.palette.divider,
          }}
          style={{ height: "100vh", overflowY: "scroll" }}
        >
          <WorldsColumn width="300px" onWorldSelected={onWorldSelected} />
        </Grid>
        <Grid item xs sx={{ mt: 1 }} style={{ height: "100vh", overflowY: "scroll" }}>
          {selectedWorldId && <WorldScreen id={selectedWorldId} />}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

function WorldScreen(props: { id: string }) {
  const {
    data: server,
    error: fetchError,
    isLoading,
    trigger: refreshServer,
  } = useFetch(useCallback(() => getServer(props.id), [props.id]));

  if (isLoading || server === null) {
    return <span>Loading...</span>;
  } else if (fetchError) {
    return <Typography>An error occurred while retrieving world information</Typography>;
  } else {
    return (
      <Container>
        <Stack spacing={1} direction="row">
          <IconButton>
            <ReplayIcon />
          </IconButton>
        </Stack>
        <Typography variant="h5">{server.name}</Typography>
        <Typography fontSize={10} variant="caption">
          {props.id}
        </Typography>
      </Container>
    );
  }
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
