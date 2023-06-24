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
import { deleteDatapack, getServerDatapacksList, ServerDTO } from "../../services/server";
import { uploadDatapack } from "../../services/server";
import { Delete } from "@mui/icons-material";

export function DatapackView(props: { server: ServerDTO }) {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  return (
    <>
      <DatapackList server={props.server} updateTrigger={updateTrigger} />
      <DatapackUpload
        server={props.server}
        onUploadCompleted={() => setUpdateTrigger(updateTrigger + 1)}
      />
    </>
  );
}

function DatapackList(props: { server: ServerDTO; updateTrigger: number }) {
  const { server, updateTrigger } = props;

  const [datapacks, setDatapacks] = useState<string[]>();
  const [deleteUpdateTrigger, setDeleteUpdateTrigger] = useState(0);

  useEffect(() => {
    getServerDatapacksList(server.id).then((result) => setDatapacks(result));
  }, [server.id, updateTrigger, deleteUpdateTrigger]);

  const onDeleteClick = (serverId: string, datapackName: string) => {
    deleteDatapack(serverId, datapackName);
    setDeleteUpdateTrigger(deleteUpdateTrigger + 1);
  };

  const listItems = datapacks?.map((datapack) => (
    <>
      <ListItem
        key={datapack}
        secondaryAction={
          <IconButton edge="end" onClick={() => onDeleteClick(server.id, datapack)}>
            <Delete />
          </IconButton>
        }
      >
        {datapack}
      </ListItem>
    </>
  ));

  return <List>{listItems}</List>;
}

function DatapackListItem(props: { server: ServerDTO; datapackName: string }) {
  const { server, datapackName } = props;

  const onDeleteClick = (serverId: string, datapackName: string) => {
    deleteDatapack(serverId, datapackName);
  };

  return (
    <>
      <ListItem
        key={datapackName}
        secondaryAction={
          <IconButton edge="end" onClick={() => onDeleteClick(server.id, datapackName)}>
            <Delete />
          </IconButton>
        }
      >
        {datapackName}
      </ListItem>
    </>
  );
}

function DeleteDatapackDialog(props: { open: boolean; onConfirm: () => void }) {
  const { open, onConfirm } = props;

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogContentText>Delete datapack?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

function DatapackUpload(props: { server: ServerDTO; onUploadCompleted: () => void | undefined }) {
  const { server, onUploadCompleted } = props;

  const [uploadFile, setUploadFile] = useState<File>();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (uploadFile) {
      await uploadDatapack(server.id, uploadFile);
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
