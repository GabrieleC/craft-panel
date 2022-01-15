import { Typography } from "@mui/material";

export function Tag(props: {
  label: string;
  color?: "default" | "primary" | "error" | "secondary" | "info" | "success" | "warning";
}) {
  const color = props.color || "primary";

  return (
    <Typography
      component="span"
      sx={{
        p: 0.1,
        pr: 0.5,
        pl: 0.5,
        fontSize: "caption",
        display: "inline",
        bgcolor: color + ".main",
        color: color + ".contrastText",
      }}
      style={{ borderRadius: "2px", fontVariant: "small-caps" }}
    >
      {props.label.toLowerCase()}
    </Typography>
  );
}
