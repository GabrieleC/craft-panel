import { useState } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { ServerDTO, updateServer } from "../../services/server";
import { useCall } from "../hooks";

export function UpdateServerDialog(props: {
  server: ServerDTO;
  onFinish: (changed: boolean) => void;
}) {
  const { server } = props;
  const [name, setName] = useState(server.name);

  const {
    error: updateError,
    isCalling: isUpdating,
    call: update,
  } = useCall(() => updateServer(server.id, name, server.note));

  let content;
  if (isUpdating) {
    content = <Typography>Updating...</Typography>;
  } else if (updateError) {
    content = <Typography>An error occurred while updating</Typography>;
  } else {
    content = (
      <TextField label="World name" value={name} onChange={(e) => setName(e.target.value)} />
    );
  }

  return (
    <Dialog open={true} onClose={props.onFinish}>
      {!isUpdating && <DialogTitle>Edit world</DialogTitle>}
      <DialogContent>{content}</DialogContent>
      {!isUpdating && (
        <DialogActions>
          <Button onClick={() => props.onFinish(false)}>Cancel</Button>
          <Button
            disabled={!name || name === server.name}
            onClick={() => update().then(() => props.onFinish(true))}
          >
            Update
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
