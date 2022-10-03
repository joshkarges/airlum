import { makeStyles } from "tss-react/mui";
import { VFC } from "react";
import { Color, Player } from "../../models/Splendor";
import { Grid, Card as MuiCard } from "@mui/material";
import _ from "lodash";
import { useGame } from "../../redux/selectors";
import classNames from "classnames";
import { getPlayerIndex, isLastTurns } from "../../utils/splendor";

const useStyles = makeStyles()((theme) => ({
  opponentContainer: {
    display: "flex",
    margin: theme.spacing(2),
    padding: theme.spacing(1),
    fontSize: 12,
  },
  currentPlayer: {
    background: "#ffe6b5",
  },
  fourColorBlock: {},
  cardCoinContainer: {
    "&&": { maxWidth: "none" },
    "& > div": {
      color: "white",
      textShadow: `-1px -1px 0 #000,
1px -1px 0 #000,
-1px 1px 0 #000,
1px 1px 0 #000`,
    },
  },
  card: {
    width: 15,
    height: 20,
    borderRadius: 4,
    border: "1px solid black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  coin: {
    width: 15,
    height: 15,
    borderRadius: "50%",
    border: "1px solid black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  points: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    fontSize: 24,
  },
  lastTurns: {
    margin: theme.spacing(2),
    textAlign: "center",
    fontSize: 24,
  },
}));

type CoinAndCardProps = {
  color: Color;
  cardCount: number;
  coinCount: number;
};
const CoinAndCard: VFC<CoinAndCardProps> = ({
  color,
  cardCount,
  coinCount,
}) => {
  const { classes } = useStyles();
  return (
    <Grid item xs={4} className={classes.cardCoinContainer}>
      <div className={classes.coin} style={{ background: color }}>
        {coinCount}
      </div>
      <div className={classes.card} style={{ background: color }}>
        {!!cardCount && cardCount}
      </div>
    </Grid>
  );
};

type OpponentProp = Player & {
  currentPlayer: boolean;
};
const Opponent: VFC<OpponentProp> = ({
  coins,
  points,
  bought,
  reserved,
  currentPlayer,
}) => {
  const { classes } = useStyles();
  const boughtByColor = _.groupBy(bought, "color");
  return (
    <MuiCard
      className={classNames(classes.opponentContainer, {
        [classes.currentPlayer]: currentPlayer,
      })}
    >
      <div className={classes.fourColorBlock}>
        <Grid container rowSpacing={1} columnSpacing={0}>
          <CoinAndCard
            color={Color.White}
            cardCount={boughtByColor.white?.length}
            coinCount={coins.white}
          />
          <CoinAndCard
            color={Color.Blue}
            cardCount={boughtByColor.blue?.length}
            coinCount={coins.blue}
          />
          <CoinAndCard
            color={Color.Green}
            cardCount={boughtByColor.green?.length}
            coinCount={coins.green}
          />
          <CoinAndCard
            color={Color.Red}
            cardCount={boughtByColor.red?.length}
            coinCount={coins.red}
          />
          <CoinAndCard
            color={Color.Black}
            cardCount={boughtByColor.black?.length}
            coinCount={coins.black}
          />
          <CoinAndCard
            color={Color.Yellow}
            cardCount={reserved.length}
            coinCount={coins.yellow}
          />
        </Grid>
      </div>
      <div className={classes.points}>{points}</div>
    </MuiCard>
  );
};

type OpponentsProps = {};
export const Opponents: VFC<OpponentsProps> = () => {
  const { classes } = useStyles();
  const game = useGame();
  const playerIndex = getPlayerIndex(game);
  const lastTurns = isLastTurns(game);
  return (
    <div>
      <div className={classes.lastTurns}>{lastTurns && "Last Turns"}</div>
      {game.players.map((player, i) => (
        <Opponent key={i} {...player} currentPlayer={playerIndex === i} />
      ))}
    </div>
  );
};
