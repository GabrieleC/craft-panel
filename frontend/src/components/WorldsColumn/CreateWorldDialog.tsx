import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useState } from "react";
import { listVersions } from "../../services/repo";
import { createServer } from "../../services/server";
import { useCall, useFetch } from "../hooks";

export function CreateWorldDialog(props: { onFinish: (created: boolean) => void }) {
  const { onFinish } = props;

  // user input fields
  const [worldName, setWorldName] = useState<string>("New world");
  const [seed, setSeed] = useState<string | undefined>();
  const [version, setVersion] = useState<string | undefined>();

  const versionsFetcher = useFetch(listVersions);
  const { data: versions, error: versionsError, isLoading: versionsLoading } = versionsFetcher;

  const {
    isCalling: createInProgress,
    error: createError,
    call: performCreation,
  } = useCall(async () => {
    await createServer({ name: worldName || "New world", seed, version });
  });

  return (
    <Dialog open={true}>
      {!createInProgress && !versionsLoading && <DialogTitle>Create new world</DialogTitle>}
      <DialogContent sx={{ m: 1 }}>
        <Stack spacing={1}>
          {!createInProgress && !createError && (
            <>
              <TextField
                label="World name"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
              />

              <Select
                  label="Version"
                  value={undefined}
                  onChange={e => setVersion(e.target.value)}
                >
                  {versions?.map((version) => (
                    <MenuItem value={version}>{version}</MenuItem>
                  ))}
                </Select>

              <TextField
                label="Seed (optional)"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </>
          )}
          {createInProgress && <Typography>Creating world...</Typography>}
          {createError && !createInProgress && (
            <Typography color="error">An error occurred during server creation</Typography>
          )}
        </Stack>
      </DialogContent>
      {!createInProgress && (
        <DialogActions>
          <Button onClick={() => onFinish(false)}>Cancel</Button>
          <Button onClick={() => performCreation().then(() => onFinish(true))}>Create</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
