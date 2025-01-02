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
import { useEffect, useState } from "react";
import { listVersions } from "../../services/repo";
import { createServer } from "../../services/server";
import { useCall, useFetch } from "../hooks";

export function CreateWorldDialog(props: { onFinish: (created: boolean) => void }) {
  const { onFinish } = props;

  // user input fields
  const [worldName, setWorldName] = useState<string>("New world");
  const [seed, setSeed] = useState<string | undefined>();
  const [versions, setVersions] = useState<string[] | null>(null);
  const [version, setVersion] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const result = await listVersions();
        setVersion(result[result.length - 1])
        setVersions(result);
      } catch (error) {
        setVersion("");
        setVersions([]);
      }
    })();
  }, []);

  const {
    isCalling: createInProgress,
    error: createError,
    call: performCreation,
  } = useCall(async () => {
    await createServer({ name: worldName || "New world", seed, version });
  });

  return (
    <Dialog open={true}>
      {(createInProgress || versions === null) && <DialogTitle>Loading...</DialogTitle>}
      {!createInProgress && versions !== null && (<>
        <DialogTitle>Create new world</DialogTitle>
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
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                >
                  {versions?.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
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
        <DialogActions>
          <Button onClick={() => onFinish(false)}>Cancel</Button>
          <Button onClick={() => performCreation().then(() => onFinish(true))}>Create</Button>
        </DialogActions>
        </>)}
    </Dialog>
  );
}
