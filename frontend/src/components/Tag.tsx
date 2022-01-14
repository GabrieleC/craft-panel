import { Box } from "@mui/system";

export function Tag(props: {
  label: string;
  color?: "default" | "primary" | "error" | "secondary" | "info" | "success" | "warning";
}) {
  const color = props.color || "primary";

  return (
    <Box
      sx={{
        p: 0.3,
        pr: 0.6,
        pl: 0.6,
        fontSize: "caption",
        display: "inline",
        bgcolor: color + ".main",
        color: color + ".contrastText",
      }}
      style={{ borderRadius: "2px", fontVariant: "small-caps" }}
    >
      {props.label.toLowerCase()}
    </Box>
  );
}
