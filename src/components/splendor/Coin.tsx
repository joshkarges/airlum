import { makeStyles } from "tss-react/mui";
import { VFC } from "react";
import { Color } from "../../models/Splendor";
import { Card as MuiCard } from "@mui/material";
import { OutlineText } from "../OutlineText";

const useStyles = makeStyles()((theme) => ({
  coin: {
    "&:hover": {
      opacity: 0.8,
    },
    border: `1px solid black`,
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  empty: {
    "&&": {
      pointerEvents: "none",
      opacity: 0,
    },
  },
}));

export type CoinProps = {
  count: number;
  color: Color;
  onClick?: (color: Color, count?: number) => void;
  size?: number;
};
export const Coin: VFC<CoinProps> = ({ count, color, onClick, size }) => {
  const { classes, cx } = useStyles();
  return (
    <MuiCard
      className={cx(classes.coin, { [classes.empty]: !count })}
      style={{ background: color, width: size, height: size }}
      onClick={(e) => onClick?.(color, count)}
    >
      <OutlineText size={26}>{count}</OutlineText>
    </MuiCard>
  );
};
