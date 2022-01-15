import { useCallback } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { getServer, ServerDTO } from "../services/server";
import { useFetch } from "./hooks";
import ReplayIcon from "@mui/icons-material/Replay";
import { ContentCopy, PlayArrow, Stop } from "@mui/icons-material";
import { WorldStatusTag } from "./WorldStatusTag";
import { Box } from "@mui/system";
import { styled } from "@mui/material/styles";

const textFieldCommonProps = {
  variant: "outlined",
  fullWidth: true,
  size: "small",
  sx: { mt: 2 },
  InputProps: {
    readOnly: true,
  },
} as TextFieldProps;

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

export function WorldScreen(props: { id: string }) {
  const {
    data: server,
    error: fetchError,
    isLoading,
    trigger: refreshServer,
  } = useFetch(useCallback(() => getServer(props.id), [props.id]));

  if (isLoading || server === null) {
    return <span>Loading...</span>;
  } else if (fetchError) {
    return <Typography>An error occurred while retrieving world information</Typography>;
  } else {
    const connectionUrl = process.env.REACT_APP_SERVER_HOST + ":" + server.port;

    return (
      <Box style={{ width: "400px" }}>
        <ButtonsBar server={server} />
        <Typography variant="h5">{server.name}</Typography>
        <WorldStatusTag server={server} />
        <Divider sx={{ mt: 2, mb: 1 }} />

        <TextField
          {...textFieldCommonProps}
          fullWidth={false}
          label="Minecraft version"
          value={server.version}
        />
        <TextField
          {...textFieldCommonProps}
          fullWidth={false}
          label="Creation date"
          value={server.creationDate?.toLocaleDateString()}
        />

        <TextField
          {...textFieldCommonProps}
          label="Notes"
          multiline
          minRows={3}
          value={server.note}
          InputProps={{
            readOnly: false,
          }}
        />

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

        <TextField
          {...textFieldCommonProps}
          label="Server UUID"
          value={props.id}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => navigator.clipboard.writeText(props.id)}>
                  <ContentCopy />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {server.status === "creation_error" && (
          <ErrorMessage message={server.errorMessage || "Unknown error"} />
        )}
      </Box>
    );
  }
}

function ButtonsBar(props: { server: ServerDTO }) {
  const { server } = props;
  return (
    <Stack spacing={1} direction="row" sx={{ mb: 2 }}>
      <Button variant="contained" size="small">
        <ReplayIcon />
      </Button>
      <Button variant="contained" size="small" disabled={server.stopping} color="success">
        <PlayArrow /> Start
      </Button>
      <Button variant="contained" size="small" disabled={!server.running} color="error">
        <Stop /> Stop
      </Button>
      <Button variant="contained" size="small" disabled={!server.stopping} color="error">
        <Stop /> Force stop
      </Button>
    </Stack>
  );
}

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
