import { useMemo, useState } from "react";
import "./App.css";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Container, createTheme, Grid, ThemeProvider, useMediaQuery } from "@mui/material";
import { WorldsColumn } from "./WorldsColumn";
import blueGray from "@mui/material/colors/blueGrey";
import { WorldScreen } from "./WorldScreen";

export default function App() {
  // theme
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
          secondary: blueGray,
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
          {!selectedWorldId && <Container>No world selected</Container>}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
