import { useState } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { retryCreate, ServerDTO, stopServer } from "../../services/server";
import { ContentCopy, Delete, Edit, Star, Stop } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { EasyConf } from "./EasyConf";
import { CommandsConsole } from "./CommandsConsole";
import { UpdateServerDialog } from "./UpdateServerDialog";
import { DeleteWorldDialog } from "./DeleteWorldDialog";
import { UpgradeVersionDialog } from "./UpgradeVersionDialog";
import { currentUsername } from "../../services/fetcher";
import { DatapackView } from "./DatapackView";
import { ModView } from "./ModView";

const textFieldCommonProps = {
  variant: "outlined",
  fullWidth: true,
  size: "small",
  sx: { mt: 2 },
  InputProps: {
    readOnly: true,
  },
} as TextFieldProps;

const serverHost = process.env.REACT_APP_SERVER_HOST;

export function WorldScreen(props: { server: ServerDTO; onWorldChange: () => void }) {
  const { server } = props;

  return (
    <Stack style={{ width: "420px" }} spacing={2}>
      <ButtonsBar server={server} onWorldChange={props.onWorldChange} />
      <ServerInfo server={server} />

      {server.status === "created" && (
        <>
          {server.upgradable && (
            <UpgradeButton server={server} onWorldChange={props.onWorldChange} />
          )}
          <ConnectionUrl server={server} />

          <Divider>
            <Chip label="COMMAND CONSOLE" size="small" />
          </Divider>
          <CommandsConsole serverId={server.id} />

          <Divider>
            <Chip label="MODS" size="small" />
          </Divider>
          <ModView server={server} />

          <Divider>
            <Chip label="DATAPACKS" size="small" />
          </Divider>
          <DatapackView server={server} />

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

function ServerInfo(props: { server: ServerDTO }) {
  const { server } = props;
  const currentUser = currentUsername();
  return (
    <TextField
      {...textFieldCommonProps}
      label="Server info"
      multiline
      minRows={2}
      value={
        "Minecraft version " +
        server.version +
        "\nCreated on " +
        server.creationDate?.toLocaleDateString() +
        "\nOwner: " +
        server.owner +
        "\nUUID: " +
        server.id
      }
    />
  );
}

function UpgradeButton(props: { server: ServerDTO; onWorldChange: () => void }) {
  const [openUpgradeDialog, setOpenUpgradeDialog] = useState(false);

  const { server, onWorldChange } = props;
  return (
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
              onWorldChange();
            }
          }}
        />
      )}
    </>
  );
}

function ButtonsBar(props: { server: ServerDTO; onWorldChange: () => void }) {
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { server, onWorldChange } = props;
  const currentUser = currentUsername();

  return (
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
        disabled={server.running || server.status === "provisioning" || !isOwner(server.owner)}
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
              onWorldChange();
            }
            setOpenDeleteDialog(false);
          }}
        />
      )}

      <Button
        disabled={!isOwner(server.owner)}
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
              onWorldChange();
            }
          }}
        />
      )}
    </Stack>
  );
}

function isOwner(owner: string): boolean {
  const currentUser = currentUsername();
  return owner === currentUser || currentUser === "admin";
}

function ConnectionUrl(props: { server: ServerDTO }) {
  const connectionUrl = serverHost + ":" + props.server.port;
  return (
    <TextField
      {...textFieldCommonProps}
      label="Connection URL"
      value={connectionUrl}
      InputProps={{
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton edge="end" onClick={() => navigator.clipboard.writeText(connectionUrl)}>
              <ContentCopy />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
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
