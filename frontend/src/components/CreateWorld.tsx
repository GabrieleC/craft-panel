import { MenuItem, Select, Stack, TextField } from "@mui/material";
import { versions } from "process";
import { useState } from "react";

export function CreateWorld(props: { versions: string[] }) {
  const { versions } = props;

  const [worldName, setWorldName] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  const versionMenuItems = versions.map((i) => (
    <MenuItem key={i} value={i}>
      {i}
    </MenuItem>
  ));
  const defaultValue = versions[versions.length - 1];

  return (
    <Stack>
      <TextField
        label="World name"
        value={worldName}
        placeholder="Wonderful world"
        onChange={(e) => setWorldName(e.target.value)}
      />
      <Select
        value={version || defaultValue}
        label="Version"
        onChange={(e) => setVersion(e.target.value)}
      >
        {versionMenuItems}
      </Select>
    </Stack>
  );
}
