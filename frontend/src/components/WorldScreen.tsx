import { useState } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { retryCreate, ServerDTO, stopServer, updateServer } from "../services/server";
import { useCall } from "./hooks";
import { ContentCopy, Delete, Edit, Stop } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { EasyConf } from "./EasyConf";

const textFieldCommonProps = {
  variant: "outlined",
  fullWidth: true,
  size: "small",
  sx: { mt: 2 },
  InputProps: {
    readOnly: true,
  },
} as TextFieldProps;

export function WorldScreen(props: { server: ServerDTO; onWorldChange: () => void }) {
  const { server } = props;
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const connectionUrl = process.env.REACT_APP_SERVER_HOST + ":" + server.port;

  return (
    <Stack style={{ width: "420px" }} spacing={2}>
      <Stack spacing={1} direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          disabled={!server.stopping}
          color="error"
          startIcon={<Stop />}
          onClick={() => stopServer(server.id, true)}
        >
          Force stop
        </Button>
        <Button variant="contained" size="small" color="error" startIcon={<Delete />}>
          Delete world
        </Button>
        <Button
          variant="contained"
          size="small"
          color="info"
          startIcon={<Edit />}
          onClick={() => setOpenUpdateDialog(true)}
        >
          Rename
        </Button>
        {openUpdateDialog && (
          <UpdateServerDialog
            server={server}
            onFinish={(changed) => {
              setOpenUpdateDialog(false);
              if (changed) {
                props.onWorldChange();
              }
            }}
          />
        )}
      </Stack>

      <TextField
        {...textFieldCommonProps}
        label="Server info"
        value={
          "Minecraft v" +
          server.version +
          " - created at " +
          server.creationDate?.toLocaleDateString()
        }
      />

      {server.status === "created" && (
        <>
          <TextField
            {...textFieldCommonProps}
            label="Connection URL"
            value={connectionUrl}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => navigator.clipboard.writeText(connectionUrl)}
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Divider>
            <Chip label="CONFIGURATION" size="small" />
          </Divider>
          <EasyConf serverId={server.id} />
        </>
      )}
      {server.status === "creation_error" && (
        <ErrorMessage server={server} onWorldChange={props.onWorldChange} />
      )}
    </Stack>
  );
  // }
}

function UpdateServerDialog(props: { server: ServerDTO; onFinish: (changed: boolean) => void }) {
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
      <DialogTitle>Edit world</DialogTitle>
      <DialogContent>{content}</DialogContent>
      {!isUpdating && (
        <DialogActions>
          <Button onClick={() => props.onFinish(false)}>Cancel</Button>
          <Button disabled={!name} onClick={() => update().then(() => props.onFinish(true))}>
            Update
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

const ErrorTextField = styled(TextField)({
  "& .MuiInput-underline:after": {
    borderBottomColor: "red",
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "red",
    },
    "&:hover fieldset": {
      borderColor: "red",
    },
    "&.Mui-focused fieldset": {
      borderColor: "red",
    },
  },
});

function ErrorMessage(props: { server: ServerDTO; onWorldChange: () => void }) {
  return (
    <Stack direction="column" spacing={2}>
      <ErrorTextField
        {...textFieldCommonProps}
        label="Error message"
        multiline
        value={props.server.errorMessage}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => {
                retryCreate(props.server.id);
                props.onWorldChange();
              }}
            >
              Retry
            </Button>
          ),
        }}
      />
      {props.server.initLog && (
        <>
          <Divider>
            <Chip size="small" label="INITIALIZATION LOG" />
          </Divider>
          <Typography component="pre" variant="caption" style={{ whiteSpace: "pre-wrap" }}>
            {props.server.initLog}
          </Typography>
        </>
      )}
    </Stack>
  );
}
