import { ChangeEvent, useEffect, useState } from "react";
import {
  Button,
  Stack,
  Input,
  List,
  ListItem,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { deleteMod, getServerModsList, ServerDTO } from "../../services/server";
import { uploadMod } from "../../services/server";
import { Delete } from "@mui/icons-material";

export function ModView(props: { server: ServerDTO }) {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  return (
    <>
      <ModList server={props.server} updateTrigger={updateTrigger} />
      <ModUpload
        server={props.server}
        onUploadCompleted={() => setUpdateTrigger(updateTrigger + 1)}
      />
    </>
  );
}

function ModList(props: { server: ServerDTO; updateTrigger: number }) {
  const { server, updateTrigger } = props;

  const [mods, setMods] = useState<string[]>();
  const [deleteUpdateTrigger, setDeleteUpdateTrigger] = useState(0);

  useEffect(() => {
    getServerModsList(server.id).then((result) => setMods(result));
  }, [server.id, updateTrigger, deleteUpdateTrigger]);

  const listItems = mods?.map((mod) => (
    <ModListItem
      server={server}
      modName={mod}
      onModDeleted={() => setDeleteUpdateTrigger(deleteUpdateTrigger + 1)}
    />
  ));

  return <List>{listItems}</List>;
}

function ModListItem(props: {
  server: ServerDTO;
  modName: string;
  onModDeleted: () => void;
}) {
  const { server, modName, onModDeleted } = props;

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const onDeleteMod = async function () {
    await deleteMod(server.id, modName);
    setOpenDeleteDialog(false);
    if (onModDeleted) {
      onModDeleted();
    }
  };

  return (
    <>
      <ListItem
        key={modName}
        secondaryAction={
          <IconButton edge="end" onClick={() => setOpenDeleteDialog(true)}>
            <Delete />
          </IconButton>
        }
      >
        {modName}
      </ListItem>
      <DeleteModDialog
        open={openDeleteDialog}
        onCancel={() => setOpenDeleteDialog(false)}
        onConfirm={onDeleteMod}
      />
    </>
  );
}

function DeleteModDialog(props: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { open, onConfirm, onCancel } = props;

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogContentText>Delete mod?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

function ModUpload(props: { server: ServerDTO; onUploadCompleted: () => void | undefined }) {
  const { server, onUploadCompleted } = props;

  const [uploadFile, setUploadFile] = useState<File>();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (uploadFile) {
      await uploadMod(server.id, uploadFile);
      if (onUploadCompleted) {
        onUploadCompleted();
      }
    }
  };

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Input type="file" onChange={handleFileChange}></Input>
      <Button
        disabled={!uploadFile}
        variant="contained"
        size="small"
        color="info"
        onClick={handleUploadClick}
      >
        Upload
      </Button>
    </Stack>
  );
}
