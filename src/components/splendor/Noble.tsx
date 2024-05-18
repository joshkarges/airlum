import { makeStyles } from "tss-react/mui";
import _ from "lodash";
import { VFC } from "react";
import { Noble as NobleModel } from "../../models/Splendor";
import { Card as MuiCard } from "@mui/material";

const useStyles = makeStyles()((theme) => ({
  nobleContainer: {
    display: "flex",
    justifyContent: "space-between",
    boxSizing: "border-box",
    padding: 4,
    width: 54,
    border: `1px solid black`,
    borderRadius: 4,
    flexDirection: "column",
    cursor: "pointer",
    userSelect: "none",
  },
  nobleCardsContainer: {
    display: "flex",
    gap: 2,
  },
  nobleCard: {
    border: `1px solid black`,
    borderRadius: 4,
    height: 16,
    fontSize: 10,
    width: 11,
    color: "white",
    textShadow: `-1px -1px 0 #000,
1px -1px 0 #000,
-1px 1px 0 #000,
1px 1px 0 #000`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  points: {
    fontSize: 16,
  },
}));
type NobleCardProps = {
  cost: number;
  color: string;
};
export const NobleCard: VFC<NobleCardProps> = ({ color, cost }) => {
  const { classes } = useStyles();
  return (
    <div style={{ background: color }} className={classes.nobleCard}>
      {cost}
    </div>
  );
};

type NobleProps = NobleModel & {
  onClick?: (noble: NobleModel) => void;
};
export const Noble: VFC<NobleProps> = ({ onClick, ...noble }) => {
  const { classes } = useStyles();
  const { cards, points } = noble;
  return (
    <MuiCard
      className={classes.nobleContainer}
      onClick={(e) => onClick?.(noble)}
    >
      <div className={classes.points}>{points}</div>
      <div className={classes.nobleCardsContainer}>
        {_.map(
          cards,
          (cost, color) =>
            !!cost && <NobleCard key={color} color={color} cost={cost} />
        )}
      </div>
    </MuiCard>
  );
};
