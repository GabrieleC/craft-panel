import { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  FormControlLabel,
  MenuItem,
  Select,
  SelectProps,
  Stack,
  Switch,
} from "@mui/material";
import { getServerProperties, setServerProperties } from "../services/server";
import { useCall, useFetch } from "./hooks";
import { SaveAlt } from "@mui/icons-material";
import serverPropertiesDefaults from "../server-properties-defaults";

const inputCommonProps = {
  size: "small",
  fullWidth: true,
} as SelectProps;

export function EasyConf(props: { serverId: string }) {
  const [modified, setModified] = useState(false);
  const [editCounter, setEditorCounter] = useState(0);

  const {
    data: properties,
    error: fetchError,
    isLoading,
  } = useFetch(useCallback(() => getServerProperties(props.serverId), [props.serverId]));

  const {
    error: saveError,
    isCalling: isSaving,
    call: saveProps,
  } = useCall(() => setServerProperties(props.serverId, properties || {}));

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  } else if (fetchError || saveError) {
    return <Typography>An error occurred while processing configuration</Typography>;
  } else if (isSaving) {
    return <Typography>Saving...</Typography>;
  } else if (properties) {
    const prop = (propName: string): string =>
      String(properties[propName] || serverPropertiesDefaults[propName]);

    const propChange = (propName: string, value: unknown) => {
      properties[propName] = String(value); // edit state in place
      setEditorCounter(editCounter + 1); // force update
      setModified(true);
    };

    return (
      <Stack spacing={2} direction="column">
        <Button
          variant="contained"
          size="small"
          color="success"
          onClick={() => {
            saveProps();
            setModified(false);
          }}
          disabled={!modified}
          startIcon={<SaveAlt />}
        >
          Save
        </Button>
        <Stack spacing={2} direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption">Gamemode</Typography>
          <Select
            {...inputCommonProps}
            value={
              prop("gamemode") === "survival" && prop("hardcore") === "true"
                ? "hardcore"
                : prop("gamemode")
            }
            label="Gamemode"
            onChange={(e) => {
              const value = e.target.value;
              if (value === "hardcore") {
                propChange("gamemode", "survival");
                propChange("hardcore", "true");
                propChange("difficulty", "hard");
              } else {
                propChange("gamemode", e.target.value);
                propChange("hardcore", "false");
              }
            }}
          >
            <MenuItem value="survival">Survival</MenuItem>
            <MenuItem value="creative">Creative</MenuItem>
            <MenuItem value="adventure">Adventure</MenuItem>
            <MenuItem value="spectator">Spectator</MenuItem>
            <MenuItem value="hardcore">Hardcore</MenuItem>
          </Select>

          <Select
            {...inputCommonProps}
            value={prop("difficulty")}
            label="Difficulty"
            disabled={prop("hardcore") === "true"}
            onChange={(e) => propChange("difficulty", e.target.value)}
          >
            <MenuItem value="peaceful">Peaceful</MenuItem>
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </Select>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("spawn-npcs", e.target.checked)}
              checked={prop("spawn-npcs") === "true"}
            />
          }
          label="Allow NPCs to spawn"
        />

        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("spawn-animals", e.target.checked)}
              checked={prop("spawn-animals") === "true"}
            />
          }
          label="Allow animals to spawn"
        />

        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("spawn-monsters", e.target.checked)}
              checked={prop("spawn-monsters") === "true"}
            />
          }
          label="Allow monsters to spawn"
        />
        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("enable-command-block", e.target.checked)}
              checked={prop("enable-command-block") === "true"}
            />
          }
          label="Enable command blocks"
        />

        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("allow-flight", e.target.checked)}
              checked={prop("allow-flight") === "true"}
            />
          }
          label="Allow players to fly with mods, otherwise they will be kicked by server"
        />

        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("allow-nether", e.target.checked)}
              checked={prop("allow-nether") === "true"}
            />
          }
          label="Enable the Nether"
        />

        <FormControlLabel
          control={
            <Switch
              onChange={(e) => propChange("pvp", e.target.checked)}
              checked={prop("pvp") === "true"}
            />
          }
          label="Players can hurt and kill each other"
        />
      </Stack>
    );
  } else {
    return null; // should not happen
  }
}
