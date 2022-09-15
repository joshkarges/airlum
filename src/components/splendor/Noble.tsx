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
    padding: 8,
    width: 76,
    border: `1px solid black`,
    borderRadius: 4,
    flexDirection: "column",
  },
  nobleCardsContainer: {
    display: "flex",
    gap: 8,
  },
  nobleCard: {
    border: `1px solid black`,
    borderRadius: 4,
    height: 22,
    fontSize: 14,
    width: 14,
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
    fontSize: 24,
  },
}));
type NobleCardProps = {
  cost: number;
  color: string;
};
const NobleCard: VFC<NobleCardProps> = ({ color, cost }) => {
  const { classes } = useStyles();
  return (
    <div style={{ background: color }} className={classes.nobleCard}>
      {cost}
    </div>
  );
};

type NobleProps = NobleModel;
export const Noble: VFC<NobleProps> = ({ cards, points }) => {
  const { classes } = useStyles();
  return (
    <MuiCard className={classes.nobleContainer}>
      <div className={classes.points}>{points}</div>
      <div className={classes.nobleCardsContainer}>
        {_.map(
          cards,
          (cost, color) => !!cost && <NobleCard color={color} cost={cost} />
        )}
      </div>
    </MuiCard>
  );
};
