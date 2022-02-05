import Typography from "@mui/material/Typography";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { ServerDTO, upgradeServerVersion } from "../../services/server";
import { useCall } from "../hooks";

export function UpgradeVersionDialog(props: {
  server: ServerDTO;
  onFinish: (changed: boolean) => void;
}) {
  const { server } = props;

  const {
    error: upgradeError,
    isCalling: isUpgrading,
    call: performUpgrade,
  } = useCall(() => upgradeServerVersion(server.id, server.upgradable || ""));

  return (
    <Dialog open={true} onClose={props.onFinish}>
      {!isUpgrading && <DialogTitle>Upgrade world version</DialogTitle>}
      <DialogContent>
        {!isUpgrading && !upgradeError && (
          <Typography>
            Upgrade '{server.name}' to Minecraft version {server.upgradable}?
          </Typography>
        )}
        {isUpgrading && <Typography>Upgrading world...</Typography>}
        {upgradeError && !isUpgrading && (
          <Typography color="error">An error occurred during version upgrade.</Typography>
        )}
      </DialogContent>
      {!isUpgrading && (
        <DialogActions>
          <Button onClick={() => props.onFinish(false)}>Cancel</Button>
          <Button
            color="info"
            onClick={() => {
              performUpgrade().then(() => props.onFinish(true));
            }}
          >
            Upgrade
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
