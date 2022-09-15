import { makeStyles } from "tss-react/mui";
import { Button, ButtonGroup, Card as MuiCard } from "@mui/material";
import _ from "lodash";
import { VFC } from "react";
import { useDispatch } from "react-redux";
import { Color } from "../../models/Splendor";
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
import { canAffordCard, getPlayerIndex } from "../../utils/splendor";

const useStyles = makeStyles()((theme) => ({
  onDeckContainer: {
    width: 300,
    margin: theme.spacing(4),
    padding: theme.spacing(2),
  },
  cardAndCoins: {
    display: "flex",
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
    if (actionOnDeck.type === "buyCard") {
      dispatch(unPrepBuyCard());
    } else if (actionOnDeck.type === "reserveCard") {
      dispatch(unPrepReserveCard());
    }
  };

  const onCoinClick = (color: Color) => {
    if (color === Color.Yellow) return;
    if (!actionOnDeck.coins[color]) return;
    dispatch(unPrepCoin(color));
  };

  const onTakeActionClick = () => {
    if (actionOnDeck.type === "takeCoins") {
      dispatch(
        takeActionAction({
          type: actionOnDeck.type,
          coinCost: _.mapValues(actionOnDeck.coins, (count) => -count),
        })
      );
    } else if (
      actionOnDeck.type === "buy" ||
      actionOnDeck.type === "buyReserve"
    ) {
      const coinCost = canAffordCard(player, actionOnDeck.card);
      dispatch(
        takeActionAction({
          type: actionOnDeck.type,
          coinCost: coinCost,
          card: actionOnDeck.card,
        })
      );
    } else if (actionOnDeck.type === "reserve") {
      dispatch(
        takeActionAction({
          type: actionOnDeck.type,
          coinCost: _.mapValues(actionOnDeck.coins, (count) => -count),
          card: actionOnDeck.card,
        })
      );
    }
  };

  const onCancelClick = () => {
    if (actionOnDeck.type === "none") return;
    dispatch(cancel());
  };

  return (
    <MuiCard className={classes.onDeckContainer}>
      <div className={classes.cardAndCoins}>
        {actionOnDeck.card && (
          <Card {...actionOnDeck.card} onClick={onCardClick} />
        )}
        {_.map(
          actionOnDeck.coins,
          (count: number, color: Color) =>
            !!count && (
              <Coin color={color} count={count} onClick={onCoinClick} />
            )
        )}
      </div>
      <div>
        <ButtonGroup>
          <Button
            onClick={onTakeActionClick}
            disabled={actionOnDeck.type === "none"}
          >
            Take Action
          </Button>
          <Button
            onClick={onCancelClick}
            disabled={actionOnDeck.type === "none"}
          >
            Cancel
          </Button>
        </ButtonGroup>
      </div>
    </MuiCard>
  );
};
