import { useState, useMemo } from "react";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { createTheme, Grid, ThemeProvider, useMediaQuery } from "@mui/material";
import { WorldsColumn } from "./WorldsColumn";

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CraftPanelAppBar />

      <Grid container style={{ height: "100vh" }}>
        <Grid sx={{ p: 1, borderRight: 1, borderColor: theme.palette.divider }} item>
          <Toolbar />
          <WorldsColumn width="300px" />
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
