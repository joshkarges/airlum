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
});

export const OutlineText = (props: PropsWithChildren<{ size?: number }>) => {
  const { children } = props;
  const classes = useStyles(props);
  return (
    <svg viewBox="0 0 50 50" className={classes.svg}>
      <text y="60%" x="50%" text-anchor="middle" dominant-baseline="middle">
        {children}
      </text>
    </svg>
  );
};
