import { useCallback, useState } from "react";
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
import { getServer, ServerDTO, stopServer, updateServer } from "../services/server";
import { useCall, useFetch } from "./hooks";
import { ContentCopy, Delete, Edit, Stop } from "@mui/icons-material";
import { Box } from "@mui/system";
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

export function WorldScreen(props: { id: string; onWorldChange?: () => void }) {
  const {
    data: server,
    error: fetchError,
    isLoading,
    trigger: refreshServer,
  } = useFetch(useCallback(() => getServer(props.id), [props.id]));

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  if (isLoading || server === null) {
    return <span>Loading...</span>;
  } else if (fetchError) {
    return <Typography>An error occurred while retrieving world information</Typography>;
  } else {
    const connectionUrl = process.env.REACT_APP_SERVER_HOST + ":" + server.port;

    return (
      <Stack style={{ width: "450px" }} spacing={2}>
        <Stack spacing={1} direction="row" justifyContent="space-between">
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
              onFinish={() => {
                setOpenUpdateDialog(false);
                refreshServer();
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
          <ErrorMessage message={server.errorMessage || "Unknown error"} />
        )}
      </Stack>
    );
  }
}

function UpdateServerDialog(props: { server: ServerDTO; onFinish: () => void }) {
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
      <DialogActions>
        <Button onClick={props.onFinish}>Cancel</Button>
        <Button onClick={() => update().then(props.onFinish)}>Update</Button>
      </DialogActions>
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

function ErrorMessage(props: { message: string }) {
  return (
    <Box>
      <ErrorTextField
        {...textFieldCommonProps}
        label="Error message"
        multiline
        value={props.message}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <Stack direction="column" spacing={1} sx={{ p: 1, pl: 0 }}>
              <Button variant="contained" size="small" color="success">
                Retry
              </Button>
              <Button variant="contained" size="small" color="warning">
                Show&nbsp;log
              </Button>
            </Stack>
          ),
        }}
      />
    </Box>
  );
}
