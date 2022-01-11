import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useState } from "react";
import { createServer } from "../services/server";
import { useVersions } from "./hooks";

export function CreateWorldDialog(props: { onFinish: () => void }) {
  // user input state
  const [worldName, setWorldName] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  // load versions
  const [versions, versionsError] = useVersions();
  useEffect(() => {
    // set default version
    setVersion(versions ? versions[versions.length - 1] : null);
  }, [versions]);

  // server creation status
  const [createError, setCreateError] = useState(false);
  const [createInProgress, setCreateInProgress] = useState(false);

  // render versions menu items
  const versionMenuItems = versions?.map((i) => (
    <MenuItem key={i} value={i}>
      {i}
    </MenuItem>
  ));

  // render error chip
  let errorChip;
  if (versionsError) {
    errorChip = (
      <Chip
        color="error"
        variant="outlined"
        label={"An error occurred while retrieving versions list"}
      ></Chip>
    );
  } else if (createError) {
    errorChip = (
      <Chip
        color="error"
        variant="outlined"
        label={"An error occurred during server creation"}
      ></Chip>
    );
  }

  // create function
  const onCreateClick = async () => {
    if (worldName && version) {
      try {
        setCreateInProgress(true);
        await createServer(worldName);
        setCreateError(false);
        props.onFinish();
      } catch (error) {
        setCreateInProgress(false);
        setCreateError(true);
      }
    }
  };

  // determine create button enabled flag
  const createButtonEnabled = Boolean(worldName && !createInProgress);

  return (
    <Dialog open={true}>
      <DialogTitle>Create new world</DialogTitle>
      {!versions && !versionsError && "Loading..."}
      {(versions || versionsError) && (
        <DialogContent sx={{ m: 1 }}>
          <Stack spacing={1}>
            <TextField
              label="World name"
              value={worldName || ""}
              placeholder="Wonderful world"
              onChange={(e) => setWorldName(e.target.value)}
            />
            {version && (
              <Select
                value={version}
                label="Version"
                onChange={(e) => {
                  setVersion(e.target.value);
                }}
              >
                {versionMenuItems}
              </Select>
            )}
            {errorChip}
          </Stack>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={props.onFinish}>Cancel</Button>
        <Button onClick={onCreateClick} disabled={!createButtonEnabled}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
