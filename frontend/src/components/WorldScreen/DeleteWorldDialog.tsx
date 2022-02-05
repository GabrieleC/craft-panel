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
import { deleteServer, ServerDTO } from "../../services/server";
import { useCall } from "../hooks";

export function DeleteWorldDialog(props: {
  server: ServerDTO;
  onFinish: (changed: boolean) => void;
}) {
  const { server } = props;

  const [text, setText] = useState("");

  const {
    error: deleteError,
    isCalling: isDeleting,
    call: performDelete,
  } = useCall(() => deleteServer(server.id));

  return (
    <Dialog open={true} onClose={props.onFinish}>
      {!isDeleting && <DialogTitle>Delete world</DialogTitle>}
      <DialogContent>
        {!isDeleting && !deleteError && (
          <>
            <Typography>
              To confirm world deletion please type the world name '
              <span style={{ fontWeight: "bold" }}>{server.name}</span>' in the text field below and
              press DELETE button.
            </Typography>
            <TextField
              sx={{ mt: 2 }}
              value={text}
              fullWidth
              size="small"
              onChange={(e) => setText(e.target.value)}
            />
          </>
        )}
        {isDeleting && <Typography>Deleting world...</Typography>}
        {deleteError && !isDeleting && (
          <Typography>An error occurred while deleting the world</Typography>
        )}
      </DialogContent>
      {!isDeleting && (
        <DialogActions>
          <Button onClick={() => props.onFinish(false)}>Cancel</Button>
          <Button
            color="error"
            disabled={text !== server.name}
            onClick={() => {
              performDelete().then(() => props.onFinish(true));
            }}
          >
            DELETE
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
