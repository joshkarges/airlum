import { makeStyles } from "tss-react/mui";
import { VFC } from "react";
import { Card as MuiCard, SxProps } from "@mui/material";
import { Card as CardModel } from "../../models/Splendor";
import classNames from "classnames";

const COIN_WIDTH = "1.1em";
const COIN_GAP = 8;
const CARD_WIDTH = `calc(${COIN_WIDTH} + ${COIN_WIDTH} + ${COIN_GAP}px + 11px)`;

const useStyles = makeStyles()((theme) => ({
  cardContainer: {
    border: `1px solid black`,
    borderRadius: "4px",
    margin: 16,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: CARD_WIDTH,
    cursor: "pointer",
    userSelect: "none",
    "&:hover": {
      opacity: 0.8,
    },
  },
  placeholder: {
    opacity: 0,
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottom: {
    display: "flex",
    justifyContent: "center",
    width: "fit-content",
  },
  gem: {
    border: `1px solid black`,
    borderRadius: 4,
    width: 16,
    height: 16,
  },
  points: {
    marginLeft: 16,
    fontSize: 24,
  },
  emptyPoints: {
    color: "transparent",
  },
  costContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "calc(2.2em + 16px + 4px + 8px)",
    flexWrap: "wrap",
    gap: 8,
  },
  costCoin: {
    padding: 4,
    fontSize: 12,
    height: COIN_WIDTH,
    width: COIN_WIDTH,
    textAlign: "center",
    border: `1px solid black`,
    borderRadius: 1000,
    color: "white",
    textShadow: `-1px -1px 0 #000,
1px -1px 0 #000,
-1px 1px 0 #000,
1px 1px 0 #000`,
  },
}));

type CostCoinProps = {
  cost: number;
  color: string;
};
export const CostCoin: VFC<CostCoinProps> = ({ cost, color }) => {
  const { classes } = useStyles();
  return (
    <div className={classes.costCoin} style={{ background: color }}>
      {cost}
    </div>
  );
};

type CostProps = CardModel["cost"];
export const Cost: VFC<CostProps> = ({ white, blue, green, red, black }) => {
  const { classes } = useStyles();
  return (
    <div className={classes.costContainer}>
      {!!white && <CostCoin cost={white} color="white" />}
      {!!blue && <CostCoin cost={blue} color="blue" />}
      {!!green && <CostCoin cost={green} color="green" />}
      {!!red && <CostCoin cost={red} color="red" />}
      {!!black && <CostCoin cost={black} color="black" />}
    </div>
  );
};

export type CardProps = CardModel & {
  onClick?: (card: CardModel) => void;
  placeholder?: boolean;
  className?: string;
  sx?: SxProps;
};
export const Card: VFC<CardProps> = ({
  placeholder,
  onClick,
  className,
  sx,
  ...card
}) => {
  const { color, cost, points } = card;
  const { classes, cx } = useStyles();
  return (
    <MuiCard
      className={classNames(classes.cardContainer, className, {
        [classes.placeholder]: placeholder,
      })}
      sx={sx}
      onClick={(e) => onClick?.(card)}
    >
      <div className={classes.top}>
        <div style={{ background: color }} className={classes.gem} />
        <div
          className={cx(classes.points, {
            [classes.emptyPoints]: !points,
          })}
        >
          {points}
        </div>
      </div>
      <div className={classes.bottom}>
        <Cost {...cost} />
      </div>
    </MuiCard>
  );
};
