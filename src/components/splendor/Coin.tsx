import { makeStyles } from "tss-react/mui";
import { VFC } from "react";
import { Color } from "../../models/Splendor";
import { Card as MuiCard } from "@mui/material";

const useStyles = makeStyles()((theme) => ({
  coin: {
    "&:hover": {
      opacity: 0.8,
    },
    border: `1px solid black`,
    borderRadius: "50%",
    width: 56,
    height: 56,
    fontSize: 24,
    color: "white",
    textShadow: `-1px -1px 0 #000,
1px -1px 0 #000,
-1px 1px 0 #000,
1px 1px 0 #000`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  empty: {
    pointerEvents: "none",
    opacity: 0,
  },
}));

export type CoinProps = {
  count: number;
  color: Color;
  onClick?: (color: Color, count?: number) => void;
};
export const Coin: VFC<CoinProps> = ({ count, color, onClick }) => {
  const { classes, cx } = useStyles();
  return (
    <MuiCard
      className={cx(classes.coin, { [classes.empty]: !count })}
      style={{ background: color }}
      onClick={(e) => onClick?.(color, count)}
    >
      {count}
    </MuiCard>
  );
};
