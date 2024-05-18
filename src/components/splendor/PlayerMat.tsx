import { makeStyles } from "tss-react/mui";
import { Card as MuiCard } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { VFC } from "react";
import { useActionOnDeck, useGame, useGameState } from "../../redux/selectors";
import {
  canAffordCard,
  getNumCoins,
  getPlayerIndex,
} from "../../utils/splendor";
import { Coin } from "./Coin";
import { Card as CardModel, Color } from "../../models/Splendor";
import _ from "lodash";
import { Card } from "./Card";
import { NobleCard } from "./Noble";
import { useDispatch } from "react-redux";
import { prepBuyReserveCard } from "../../redux/slices/actionOnDeck";
import { GameState, setGameState } from "../../redux/slices/gameState";
import { putCoinBack } from "../../redux/slices/game";
import { Flex } from "../Flex";

const useStyles = makeStyles()((theme) => ({
  card: {
    minWidth: 300,
    "&&": {
      width: "100%",
      boxSizing: "border-box",
    },
    margin: 4,
    padding: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  coinCardsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cardsContainer: {
    display: "flex",
    gap: 4,
  },
  miniCard: {
    width: 24,
    height: 36,
    borderRadius: 4,
    border: "1px solid black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    textShadow: `-1px -1px 0 #000,
1px -1px 0 #000,
-1px 1px 0 #000,
1px 1px 0 #000`,
  },
  nobleCard: {
    padding: 4,
  },
  reservedContainer: {
    display: "flex",
    gap: 4,
  },
}));

type PlayerMatProps = {};
export const Playermat: VFC<PlayerMatProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const gameState = useGameState();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];

  const onReservedCardClick = (card: CardModel) => {
    if (gameState !== GameState.play) return;
    if (actionOnDeck.type !== "none") return;
    const coinCost = canAffordCard(player, card);
    if (!coinCost) return;
    dispatch(prepBuyReserveCard({ card, coinCost }));
  };

  const onCoinClick = (color: Color) => {
    if (gameState !== GameState.chooseCoins) return;
    dispatch(putCoinBack({ color, playerIndex }));
    if (getNumCoins(player.coins) - 1 <= 10) dispatch(setGameState("play"));
  };

  const boughtByColor = _.groupBy(player.bought, "color");
  const coinCount = getNumCoins(player.coins);

  return (
    <div className={classes.card}>
      <Flex alignItems="center" gap="8px">
        <div>{coinCount} / 10</div>
        <div className={classes.cardsContainer}>
          {_.map(player.coins, (count: number, color: Color) => {
            const cards = boughtByColor[color];
            return (
              <div key={color} className={classes.coinCardsContainer}>
                {gameState === GameState.chooseCoins && <KeyboardArrowUpIcon />}
                <Coin
                  count={count}
                  color={color}
                  onClick={onCoinClick}
                  size={26}
                />
                {cards && (
                  <div
                    className={classes.miniCard}
                    style={{ background: color }}
                  >
                    {cards.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Flex>
      <Flex gap="4px">
        {player.reserved.map((card, i) => (
          <Card
            key={card.id}
            {...card}
            onClick={onReservedCardClick}
            placeholder={card.id === actionOnDeck.card?.id}
          />
        ))}
      </Flex>
      <MuiCard className={classes.nobleCard}>
        {player.nobles.map((noble) => (
          <Flex gap="4px">
            {noble.points}
            {_.map(
              noble.cards,
              (cost, color) => !!cost && <NobleCard cost={cost} color={color} />
            )}
          </Flex>
        ))}
      </MuiCard>
    </div>
  );
};
