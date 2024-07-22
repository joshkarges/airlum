import { makeStyles } from "tss-react/mui";
import { VFC } from "react";
import { Color, Player } from "../../models/Splendor";
import { Card as MuiCard } from "@mui/material";
import _ from "lodash";
import { useGame } from "../../redux/selectors";
import classNames from "classnames";
import { getPlayerIndex, isLastTurns } from "../../utils/splendor";
import { Flex } from "../Flex";
import { OutlineText } from "../OutlineText";
import { amber, pink } from "@mui/material/colors";
import { Settings } from "@mui/icons-material";

const useStyles = makeStyles()((theme) => ({
  opponentContainer: {
    position: "relative",
    display: "flex",
    margin: 4,
    padding: 4,
    fontSize: 12,
  },
  currentPlayer: {
    border: "2px solid blue",
  },
  humanPlayer: {
    background: amber[100],
  },
  aiPlayer: {
    background: pink[100],
  },
  fourColorBlock: {},
  cardCoinContainer: {
    "&&": { display: "flex", maxWidth: "none", alignItems: "center" },
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
    marginLeft: 12,
    fontFamily: "Arial",
  },
  lastTurns: {
    margin: theme.spacing(2),
    textAlign: "center",
    fontSize: 24,
  },
  aiIcon: {
    position: "absolute",
    top: -4,
    right: -4,
    transform: "scale(0.5)",
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
    <div className={classes.cardCoinContainer}>
      <div
        className={classes.coin}
        style={{ background: color, ...(coinCount ? {} : { opacity: 0 }) }}
      >
        <OutlineText>{coinCount}</OutlineText>
      </div>
      <div
        className={classes.card}
        style={{ background: color, ...(cardCount ? {} : { opacity: 0 }) }}
      >
        <OutlineText>{!!cardCount && cardCount}</OutlineText>
      </div>
    </div>
  );
};

type OpponentProp = Player & {
  currentPlayer: boolean;
  onlyOneHuman?: boolean;
};
const Opponent: VFC<OpponentProp> = ({
  coins,
  points,
  bought,
  reserved,
  currentPlayer,
  isHuman,
}) => {
  const { classes } = useStyles();
  const boughtByColor = _.groupBy(bought, "color");
  if (isHuman && currentPlayer) return null;
  return (
    <MuiCard
      className={classNames(classes.opponentContainer, {
        [classes.currentPlayer]: currentPlayer,
        [classes.humanPlayer]: isHuman,
        [classes.aiPlayer]: !isHuman,
      })}
    >
      <Flex rowGap="4px" flexDirection="column">
        <Flex columnGap="4px" flexWrap="nowrap">
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
        </Flex>
        <Flex columnGap="4px" flexWrap="nowrap">
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
        </Flex>
      </Flex>
      <div className={classes.points}>{points}</div>
      {!isHuman && (
        <div className={classes.aiIcon}>
          <Settings />
        </div>
      )}
    </MuiCard>
  );
};

type OpponentsProps = {};
export const Opponents: VFC<OpponentsProps> = () => {
  const { classes } = useStyles();
  const game = useGame();
  const playerIndex = getPlayerIndex(game);
  const lastTurns = isLastTurns(game);
  const onlyOneHuman = game.players.filter((p) => p.isHuman).length === 1;
  return (
    <div>
      {lastTurns && <div className={classes.lastTurns}>Last Turns</div>}
      {game.players.map((player, i) => (
        <Opponent
          key={i}
          {...player}
          currentPlayer={playerIndex === i}
          onlyOneHuman={onlyOneHuman}
        />
      ))}
    </div>
  );
};
