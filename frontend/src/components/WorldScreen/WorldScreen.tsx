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
import {
  deleteServer,
  retryCreate,
  ServerDTO,
  stopServer,
  updateServer,
  upgradeServerVersion,
} from "../../services/server";
import { useCall } from "../hooks";
import { ContentCopy, Delete, Edit, Star, Stop } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { EasyConf } from "./EasyConf";
import { CommandsConsole } from "./CommandsConsole";

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
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);
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
        <Button
          disabled={server.running || server.status === "provisioning"}
          variant="contained"
          size="small"
          color="error"
          startIcon={<Delete />}
          onClick={() => setOpenDeleteDialog(true)}
        >
          Delete world
        </Button>
        {openDeleteDialog && (
          <DeleteWorldDialog
            server={server}
            onFinish={(result) => {
              if (result) {
                props.onWorldChange();
              }
              setOpenDeleteDialog(false);
            }}
          />
        )}

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
        multiline
        minRows={2}
        value={
          "Minecraft v" +
          server.version +
          "\nCreated on " +
          server.creationDate?.toLocaleDateString() +
          "\nUUID: " +
          server.id
        }
      />

      {server.status === "created" && (
        <>
          {server.upgradable && (
            <>
              <Button
                variant="contained"
                size="small"
                color="info"
                disabled={server.running}
                startIcon={<Star />}
                onClick={() => setOpenUpgradeDialog(true)}
              >
                Upgrade to version {server.upgradable}
              </Button>
              {openUpgradeDialog && (
                <UpgradeVersionDialog
                  server={server}
                  onFinish={(changed) => {
                    setOpenUpgradeDialog(false);
                    if (changed) {
                      props.onWorldChange();
                    }
                  }}
                />
              )}
            </>
          )}
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
            <Chip label="COMMAND CONSOLE" size="small" />
          </Divider>
          <CommandsConsole serverId={server.id} />

          <Divider>
            <Chip label="WORLD SETTINGS" size="small" />
          </Divider>
          <EasyConf serverId={server.id} />
        </>
      )}
      {server.status === "creation_error" && (
        <ErrorMessage server={server} onWorldChange={props.onWorldChange} />
      )}

      {server.status === "provisioning" && <Typography>World creation in progress...</Typography>}
    </Stack>
  );
}

function DeleteWorldDialog(props: { server: ServerDTO; onFinish: (changed: boolean) => void }) {
  const { server } = props;

  const [text, setText] = useState("");

  return (
    <Dialog open={true} onClose={props.onFinish}>
      <DialogTitle>Delete world</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.onFinish(false)}>Cancel</Button>
        <Button
          color="error"
          disabled={text !== server.name}
          onClick={async () => {
            await deleteServer(server.id);
            props.onFinish(true);
          }}
        >
          DELETE
        </Button>
      </DialogActions>
    </Dialog>
  );
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

function UpgradeVersionDialog(props: { server: ServerDTO; onFinish: (changed: boolean) => void }) {
  const { server } = props;

  return (
    <Dialog open={true} onClose={props.onFinish}>
      <DialogTitle>Upgrade world version</DialogTitle>
      <DialogContent>
        <Typography>
          Upgrade '{server.name}' to Minecraft version {server.upgradable}?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.onFinish(false)}>Cancel</Button>
        <Button
          color="info"
          onClick={() => {
            upgradeServerVersion(server.id, server.upgradable || "");
            props.onFinish(true);
          }}
        >
          Upgrade
        </Button>
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
