import { makeStyles } from "tss-react/mui";
import { Button, ButtonGroup, Card as MuiCard } from "@mui/material";
import _ from "lodash";
import { useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { Color, Player } from "../../models/Splendor";
import { useActionOnDeck, useGame } from "../../redux/selectors";
import {
  actionOnDeckSlice,
  cancel,
  unPrepBuyCard,
  unPrepCoin,
  unPrepReserveCard,
} from "../../redux/slices/actionOnDeck";
import { Card, CardProps } from "./Card";
import { Coin, CoinProps } from "./Coin";
import { takeActionAction } from "../../redux/slices/game";
import {
  getAffordableNobles,
  getNumCoins,
  getPlayerIndex,
  getPossibleActions,
} from "../../utils/splendor";
import classNames from "classnames";
import { setGameState } from "../../redux/slices/gameState";
import { State } from "../../redux/rootReducer";
import { actionPool } from "../../utils/memory";

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

type DisplayActionProps = {
  action: State["actionOnDeck"];
  onCardClick?: CardProps["onClick"];
  onCoinClick?: CoinProps["onClick"];
};
const DisplayAction: VFC<DisplayActionProps> = ({
  action,
  onCardClick,
  onCoinClick,
}) => {
  const { classes } = useStyles();
  if (action.type === "none") return null;
  return (
    <div className={classes.cardAndCoins}>
      {action.card && (
        <Card
          {...action.card}
          onClick={onCardClick}
          className={classNames({
            [classes.reservedCard]: action.type === "reserve",
          })}
        />
      )}
      <div className={classes.coinsContainer}>
        {_.map(
          action.coinCost,
          (count: number, color: Color) =>
            count < 0 && (
              <Coin
                key={color}
                color={color}
                count={-count}
                onClick={onCoinClick}
              />
            )
        )}
      </div>
    </div>
  );
};

const INITIAL_WORKER = new Worker(
  new URL("../../webWorkers/getNextAction.worker.ts", import.meta.url),
  { type: "module" }
);

type OnDeckProps = {};
export const OnDeck: VFC<OnDeckProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const [aiAction, setAiAction] = useState<State["actionOnDeck"] | null>(
    actionOnDeckSlice.getInitialState()
  );
  const [depth, setDepth] = useState(0);
  const [worker, setWorker] = useState(INITIAL_WORKER);
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
    setDepth(0);
    setAiAction(null);
    worker.terminate();
    setWorker(
      new Worker(
        new URL("../../webWorkers/getNextAction.worker.ts", import.meta.url),
        { type: "module" }
      )
    );
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
    }
  };

  const onCancelClick = () => {
    if (actionOnDeck.type === "none") return;
    dispatch(cancel());
  };

  useEffect(() => {
    if (depth >= 3) return;
    worker.postMessage({ game, depth: depth + 1 });
    actionPool.start();
    console.log(getPossibleActions(game).map((a) => a.type));
    actionPool.end();
  }, [worker, game, depth]);

  useEffect(() => {
    worker.onmessage = (e) => {
      const response = e.data;
      console.log(JSON.stringify(response, null, 2));
      setAiAction(response.action);
      setDepth(response.depth);
    };
  }, [worker]);

  if (actionOnDeck.type === "none" && aiAction?.type === "none") return null;

  return (
    <MuiCard className={classes.onDeckContainer}>
      <DisplayAction
        action={actionOnDeck}
        onCardClick={onCardClick}
        onCoinClick={onCoinClick}
      />
      <div>
        <ButtonGroup>
          <Button onClick={onTakeActionClick}>Take Action</Button>
          <Button onClick={onCancelClick}>Cancel</Button>
        </ButtonGroup>
      </div>
      {aiAction ? (
        <>
          <DisplayAction action={aiAction} />
          {depth}
        </>
      ) : (
        "No AI Action."
      )}
    </MuiCard>
  );
};
