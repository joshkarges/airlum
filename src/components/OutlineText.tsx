import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { PropsWithChildren } from "react";

const useStyles = makeStyles<Theme, { size?: number }>({
  svg: {
    width: "auto",
    height: ({ size }) => size ?? 13,
    fontSize: 50,
    "& > text": {
      stroke: "black",
      fill: "white",
      strokeWidth: 2,
      strokeLinejoin: "round",
      fontWeight: 800,
      fontFamily: "Arial",
    },
  },
  outlineText: {
    color: "white",
    textShadow:
      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
    fontWeight: 800,
    fontFamily: "Arial",
    fontSize: ({ size }) => size ?? 13,
  },
});

export const OutlineText = (props: PropsWithChildren<{ size?: number }>) => {
  const { children } = props;
  const classes = useStyles(props);
  return <span className={classes.outlineText}>{children}</span>;
};
