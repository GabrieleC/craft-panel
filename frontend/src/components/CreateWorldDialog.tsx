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
import { useEffect, useState } from "react";
import { createServer } from "../services/server";
import { useFetch } from "./hooks";

export function CreateWorldDialog(props: { onFinish: (created: boolean) => void }) {
  const { onFinish } = props;

  // user input fields
  const [worldName, setWorldName] = useState<string>("New world");

  const {
    data: createdServerId,
    error: createError,
    isLoading: createInProgress,
    trigger: performCreation,
  } = useFetch(() => createServer(worldName || "New world"), true);

  // notify finish on successfull server creation
  useEffect(() => {
    if (createdServerId) {
      onFinish(true);
    }
  }, [createdServerId, onFinish]);

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
