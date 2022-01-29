import { useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  Button,
  Chip,
  createTheme,
  Grid,
  Stack,
  TextField,
  ThemeProvider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import useWebSocket from "react-use-websocket";

import { WorldsColumn } from "./WorldsColumn/WorldsColumn";
import grey from "@mui/material/colors/grey";
import { WorldScreen } from "./WorldScreen/WorldScreen";
import { useFetch } from "./hooks";
import { listServers } from "../services/server";
import { login } from "../services/auth";
import { setFetchPassword } from "../services/fetcher";

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

  const [logged, setLogged] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {logged && <LoggedApp />}
      {!logged && <LoginDialog onLogin={() => setLogged(true)} />}
    </ThemeProvider>
  );
}

function LoginDialog(props: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const onLoginClick = async () => {
    if (await login(password)) {
      setFetchPassword(password);
      props.onLogin();
    } else {
      setMessage("Wrong password");
    }
  };

  return (
    <Grid container justifyContent="center" alignItems="center" style={{ height: "100vh" }}>
      <Stack spacing={2}>
        {message && <Chip onDelete={() => setMessage(null)} label={message} color="error" />}
        <TextField sx={{ display: "none" }} value="user" />
        <TextField
          autoFocus
          label="Password"
          variant="outlined"
          type="password"
          size="small"
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              onLoginClick();
            }
          }}
          value={password}
        />
        <Button variant="contained" onClick={onLoginClick}>
          Login
        </Button>
      </Stack>
    </Grid>
  );
}

function LoggedApp() {
  const theme = useTheme();

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
    <>
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
    </>
  );
}
