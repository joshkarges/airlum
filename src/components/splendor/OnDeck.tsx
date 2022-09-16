import { makeStyles } from "tss-react/mui";
import { Button, ButtonGroup, Card as MuiCard } from "@mui/material";
import _ from "lodash";
import { VFC } from "react";
import { useDispatch } from "react-redux";
import { Color, Player } from "../../models/Splendor";
import { useActionOnDeck, useGame } from "../../redux/selectors";
import {
  cancel,
  unPrepBuyCard,
  unPrepCoin,
  unPrepReserveCard,
} from "../../redux/slices/actionOnDeck";
import { Card } from "./Card";
import { Coin } from "./Coin";
import { takeActionAction } from "../../redux/slices/game";
import {
  getAffordableNobles,
  getNumCoins,
  getPlayerIndex,
} from "../../utils/splendor";
import classNames from "classnames";
import { setGameState } from "../../redux/slices/gameState";

const useStyles = makeStyles()((theme) => ({
  onDeckContainer: {
    margin: theme.spacing(4),
    padding: theme.spacing(2),
    height: "fit-content",
  },
  cardAndCoins: {
    display: "flex",
  },
  coinsContainer: {
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  reservedCard: {
    transform: "rotateZ(-90deg)",
  },
}));

type OnDeckProps = {};
export const OnDeck: VFC<OnDeckProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];
  const dispatch = useDispatch();

  const onCardClick = () => {
    if (!actionOnDeck.card) return;
    if (actionOnDeck.type === "buy") {
      dispatch(unPrepBuyCard());
    } else if (actionOnDeck.type === "reserve") {
      dispatch(unPrepReserveCard());
    }
  };

  const onCoinClick = (color: Color) => {
    if (color === Color.Yellow) return;
    if (!actionOnDeck.coinCost[color]) return;
    dispatch(unPrepCoin(color));
  };

  const onTakeActionClick = () => {
    if (actionOnDeck.type === "takeCoins") {
      const chooseCoins =
        getNumCoins(player.coins) - getNumCoins(actionOnDeck.coinCost) > 10;
      dispatch(
        takeActionAction({
          ...actionOnDeck,
          dontAdvance: chooseCoins,
        })
      );
      if (chooseCoins) {
        dispatch(setGameState("chooseCoins"));
      }
    } else if (
      actionOnDeck.type === "buy" ||
      actionOnDeck.type === "buyReserve"
    ) {
      const playerWithCard = {
        ...player,
        bought: [...player.bought, actionOnDeck.card],
      } as Player;
      const multipleNobles =
        getAffordableNobles(game, playerWithCard).length > 1;
      dispatch(
        takeActionAction({
          ...actionOnDeck,
          dontAdvance: multipleNobles,
          popNoble: multipleNobles,
        })
      );
      if (multipleNobles) {
        dispatch(setGameState("chooseNobles"));
      }
    } else if (actionOnDeck.type === "reserve") {
      dispatch(takeActionAction(actionOnDeck));
    }
  };

  const onCancelClick = () => {
    if (actionOnDeck.type === "none") return;
    dispatch(cancel());
  };

  if (actionOnDeck.type === "none") return null;

  return (
    <MuiCard className={classes.onDeckContainer}>
      <div className={classes.cardAndCoins}>
        {actionOnDeck.card && (
          <Card
            {...actionOnDeck.card}
            onClick={onCardClick}
            className={classNames({
              [classes.reservedCard]: actionOnDeck.type === "reserve",
            })}
          />
        )}
        <div className={classes.coinsContainer}>
          {_.map(
            actionOnDeck.coinCost,
            (count: number, color: Color) =>
              count < 0 && (
                <Coin color={color} count={-count} onClick={onCoinClick} />
              )
          )}
        </div>
      </div>
      <div>
        <ButtonGroup>
          <Button onClick={onTakeActionClick}>Take Action</Button>
          <Button onClick={onCancelClick}>Cancel</Button>
        </ButtonGroup>
      </div>
    </MuiCard>
  );
};
