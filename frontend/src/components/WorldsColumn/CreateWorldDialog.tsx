import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { createServer } from "../../services/server";
import { useCall, useFetch } from "../hooks";

export function CreateWorldDialog(props: { onFinish: (created: boolean) => void }) {
  const { onFinish } = props;

  // user input fields
  const [worldName, setWorldName] = useState<string>("New world");

  const {
    isCalling: createInProgress,
    error: createError,
    call: performCreation,
  } = useCall(async () => {
    await createServer(worldName || "New world");
    onFinish(true);
  });

  return (
    <Dialog open={true}>
      <DialogTitle>Create new world</DialogTitle>
      <DialogContent sx={{ m: 1 }}>
        <Stack spacing={1}>
          <TextField
            label="World name"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
          />
          {createError && (
            <Chip
              color="error"
              variant="outlined"
              label={"An error occurred during server creation"}
            ></Chip>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.onFinish(false)}>Cancel</Button>
        <Button onClick={performCreation} disabled={createInProgress}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
