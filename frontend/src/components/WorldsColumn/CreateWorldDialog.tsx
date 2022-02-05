import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { createServer } from "../../services/server";
import { useCall } from "../hooks";

export function CreateWorldDialog(props: { onFinish: (created: boolean) => void }) {
  const { onFinish } = props;

  // user input fields
  const [worldName, setWorldName] = useState<string>("New world");
  const [seed, setSeed] = useState<string | undefined>();

  const {
    isCalling: createInProgress,
    error: createError,
    call: performCreation,
  } = useCall(async () => {
    await createServer({ name: worldName || "New world", seed });
  });

  return (
    <Dialog open={true}>
      {!createInProgress && <DialogTitle>Create new world</DialogTitle>}
      <DialogContent sx={{ m: 1 }}>
        <Stack spacing={1}>
          {!createInProgress && !createError && (
            <>
              <TextField
                label="World name"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
              />
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
