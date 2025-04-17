import { makeStyles } from "tss-react/mui";
import { Card as MuiCard, Typography } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useEffect, VFC } from "react";
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
import { OutlineText } from "../OutlineText";
import classNames from "classnames";

const useStyles = makeStyles()((theme) => ({
  card: {
    minWidth: 300,
    "&&": {
      width: "100%",
      boxSizing: "border-box",
    },
    padding: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  yourTurn: {
    border: "2px solid blue",
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
  },
  nobleCard: {
    padding: 4,
  },
  reservedContainer: {
    display: "flex",
    gap: 4,
  },
  coinFraction: {
    fontFamily: "Arial",
  },
}));

type PlayerMatProps = {};
export const PlayerMat: VFC<PlayerMatProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const gameState = useGameState();
  const dispatch = useDispatch();
  // playerIndex should be the closest previous human
  const currentPlayerIndex = getPlayerIndex(game);
  const humanPlayerIndex =
    (currentPlayerIndex -
      _.range(game.players.length).find((d) => {
        return game.players[(currentPlayerIndex - d) % game.players.length]
          .isHuman;
      })!) %
    game.players.length;
  const player = game.players[humanPlayerIndex];
  const isYourTurn = currentPlayerIndex === humanPlayerIndex;

  const onReservedCardClick = (card: CardModel) => {
    if (gameState !== GameState.play) return;
    if (actionOnDeck.type !== "none") return;
    const coinCost = canAffordCard(player, card);
    if (!coinCost) return;
    dispatch(prepBuyReserveCard({ card, coinCost }));
  };

  const onCoinClick = (color: Color) => {
    if (gameState !== GameState.chooseCoins) return;
    dispatch(putCoinBack({ color, playerIndex: currentPlayerIndex }));
    if (getNumCoins(player.coins) - 1 <= 10) {
      dispatch(setGameState("play"));
    }
  };

  const boughtByColor = _.groupBy(player.bought, "color");
  const coinCount = getNumCoins(player.coins);
  const currentPlayerCoinCount = getNumCoins(
    game.players[currentPlayerIndex].coins
  );

  useEffect(() => {
    if (
      gameState === GameState.chooseCoins &&
      !game.players[currentPlayerIndex].isHuman
    ) {
      // Discard random coins until the player has 10 or less
      const color = _.sample(
        _.without(Object.values(Color), Color.Yellow).filter(
          (color) => game.players[currentPlayerIndex].coins[color] > 0
        )
      ) as Color;
      dispatch(putCoinBack({ color, playerIndex: currentPlayerIndex }));
      if (currentPlayerCoinCount - 1 <= 10) {
        dispatch(setGameState("play"));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentPlayerIndex, currentPlayerCoinCount]);

  return (
    <div
      className={classNames(classes.card, { [classes.yourTurn]: isYourTurn })}
    >
      <Flex alignItems="center" gap="8px">
        <Typography variant="h5">{player.points}</Typography>
        <div className={classes.coinFraction}>{coinCount} / 10</div>
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
                    <OutlineText>{cards.length}</OutlineText>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Flex>
      {!!player.reserved.length && (
        <Flex gap="4px">
          {player.reserved.map((card, i) => (
            <Card
              key={card.id}
              {...card}
              onClick={onReservedCardClick}
              placeholder={card.id === actionOnDeck.card?.id}
              sx={{
                transform: "scale(0.8)",
              }}
            />
          ))}
        </Flex>
      )}
      {!!player.nobles.length && (
        <MuiCard className={classes.nobleCard}>
          {player.nobles.map((noble) => (
            <Flex gap="4px" key={noble.id}>
              {noble.points}
              {_.map(
                noble.cards,
                (cost, color) =>
                  !!cost && <NobleCard cost={cost} color={color} />
              )}
            </Flex>
          ))}
        </MuiCard>
      )}
    </div>
  );
};
