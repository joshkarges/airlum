import { makeStyles } from "tss-react/mui";
import {
  Button,
  ButtonGroup,
  IconButton,
  Card as MuiCard,
} from "@mui/material";
import _ from "lodash";
import { useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { Color, Player } from "../../models/Splendor";
import { useActionOnDeck, useGame, useGameState } from "../../redux/selectors";
import {
  actionOnDeckSlice,
  cancel,
  setActionOnDeck,
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
import { Close } from "@mui/icons-material";

const useStyles = makeStyles()((theme) => ({
  onDeckContainer: {
    margin: 4,
    padding: theme.spacing(1),
    height: "fit-content",
    rowGap: 4,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
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
    transform: "rotateZ(-90deg)translateY(13px)",
  },
  aiContainer: {
    cursor: "pointer",
  },
  takeActionButton: {
    textWrap: "nowrap",
  },
  cancelActionButton: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
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
  const gameState = useGameState();
  if (gameState === "chooseCoins")
    return <div>You must discard down to 10 coins</div>;
  if (gameState === "chooseNobles") return <div>Choose a noble</div>;
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
  const gameState = useGameState();
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
    const actionToTake =
      actionOnDeck.type === "none" && !!aiAction ? aiAction : actionOnDeck;
    let nextGameState = gameState;
    if (actionToTake.type === "takeCoins") {
      const chooseCoins =
        getNumCoins(player.coins) - getNumCoins(actionToTake.coinCost) > 10;
      dispatch(
        takeActionAction({
          ...actionToTake,
          dontAdvance: chooseCoins,
        })
      );
      if (chooseCoins) {
        nextGameState = "chooseCoins";
      }
    } else if (
      actionToTake.type === "buy" ||
      actionToTake.type === "buyReserve"
    ) {
      const playerWithCard = {
        ...player,
        bought: [...player.bought, actionToTake.card],
      } as Player;
      const multipleNobles =
        getAffordableNobles(game, playerWithCard).length > 1;
      dispatch(
        takeActionAction({
          ...actionToTake,
          dontAdvance: multipleNobles,
          popNoble: multipleNobles,
        })
      );
      if (multipleNobles) {
        nextGameState = "chooseNobles";
      }
    } else if (actionToTake.type === "reserve") {
      const chooseCoins =
        getNumCoins(player.coins) - getNumCoins(actionToTake.coinCost) > 10;
      dispatch(
        takeActionAction({
          ...actionToTake,
          dontAdvance: chooseCoins,
        })
      );
      if (chooseCoins) {
        nextGameState = "chooseCoins";
      }
    }
    dispatch(setGameState(nextGameState));
    if (nextGameState === "play") {
      setWorker(
        new Worker(
          new URL("../../webWorkers/getNextAction.worker.ts", import.meta.url),
          { type: "module" }
        )
      );
    }
  };

  const onCancelClick = () => {
    if (actionOnDeck.type === "none") return;
    dispatch(cancel());
  };

  const onAiActionClick = () => {
    if (!aiAction) return;
    if (aiAction.type === "none") return;
    dispatch(setActionOnDeck(aiAction));
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

  useEffect(() => {
    if (gameState === "play") {
      setWorker(
        new Worker(
          new URL("../../webWorkers/getNextAction.worker.ts", import.meta.url),
          { type: "module" }
        )
      );
    }
  }, [gameState]);

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
          <Button
            className={classes.takeActionButton}
            onClick={onTakeActionClick}
            disabled={
              (actionOnDeck.type === "none" && !aiAction) ||
              gameState !== "play" ||
              (actionOnDeck.type === "takeCoins" &&
                -getNumCoins(actionOnDeck.coinCost) <
                  Math.min(3, _.filter(game.coins, Boolean).length) &&
                !_.some(actionOnDeck.coinCost, (cost) => {
                  return -cost >= 2;
                }))
            }
          >
            End Turn
          </Button>
          <IconButton
            className={classes.cancelActionButton}
            onClick={onCancelClick}
          >
            <Close />
          </IconButton>
        </ButtonGroup>
      </div>
      {aiAction ? (
        <div className={classes.aiContainer} onClick={onAiActionClick}>
          <DisplayAction action={aiAction} />
          {`AI suggestion ${depth}`}
        </div>
      ) : (
        "No AI Action."
      )}
    </MuiCard>
  );
};
