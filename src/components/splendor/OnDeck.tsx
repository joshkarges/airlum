import { makeStyles } from "tss-react/mui";
import {
  Button,
  ButtonGroup,
  IconButton,
  Card as MuiCard,
} from "@mui/material";
import _ from "lodash";
import { useCallback, useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { Color, Player } from "../../models/Splendor";
import { useActionOnDeck, useGame, useGameState } from "../../redux/selectors";
import {
  actionOnDeckSlice,
  cancelAllPrep,
  prepBuyCard,
  prepReserveCard,
  setActionOnDeck,
  unPrepBuyCard,
  unPrepCoin,
  unPrepReserveCard,
} from "../../redux/slices/actionOnDeck";
import { Card, CardProps } from "./Card";
import { Coin, CoinProps } from "./Coin";
import { takeActionAction } from "../../redux/slices/game";
import {
  canAffordCard,
  getAffordableNobles,
  getNumCoins,
  getPlayerIndex,
  getPossibleActions,
} from "../../utils/splendor";
import classNames from "classnames";
import { setGameState } from "../../redux/slices/gameState";
import { State } from "../../redux/rootReducer";
import { actionPool } from "../../utils/memory";
import { Close, Rotate90DegreesCcw } from "@mui/icons-material";
import { Flex } from "../Flex";

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
    if (!player.isHuman) return;
    if (!actionOnDeck.card) return;
    if (actionOnDeck.type === "buy") {
      dispatch(unPrepBuyCard());
    } else if (actionOnDeck.type === "reserve") {
      dispatch(unPrepReserveCard());
    }
  };

  const onCoinClick = (color: Color) => {
    if (!player.isHuman) return;
    if (color === Color.Yellow) return;
    if (!actionOnDeck.coinCost[color]) return;
    dispatch(unPrepCoin(color));
    const needToChooseNoble = getAffordableNobles(game, player).length > 1;
    if (needToChooseNoble) {
      dispatch(setGameState("chooseNobles"));
    }
  };

  const onTakeActionClick = useCallback(
    (inAction?: State["actionOnDeck"]) => {
      setDepth(0);
      setAiAction(null);
      worker.terminate();
      const actionToTake = inAction
        ? inAction
        : actionOnDeck.type === "none" && !!aiAction
        ? aiAction
        : actionOnDeck;
      let nextGameState = gameState;
      let needToChooseCoins = false;
      needToChooseCoins =
        getNumCoins(player.coins) - getNumCoins(actionToTake.coinCost) > 10;
      const playerWithCard = {
        ...player,
        bought: [...player.bought, actionToTake.card].filter(Boolean),
      } as Player;
      const needToChooseNoble =
        getAffordableNobles(game, playerWithCard).length > 1;
      if (actionToTake.type !== "none") {
        dispatch(
          takeActionAction({
            ...actionToTake,
            dontAdvance: needToChooseNoble || needToChooseCoins,
            popNoble:
              (actionToTake.type === "buy" ||
                actionOnDeck.type === "buyReserve") &&
              needToChooseNoble,
            playerIndex,
          })
        );
      }
      dispatch(
        setGameState(
          needToChooseNoble
            ? "chooseNobles"
            : needToChooseCoins
            ? "chooseCoins"
            : "play"
        )
      );
      if (nextGameState === "play") {
        setWorker(
          new Worker(
            new URL(
              "../../webWorkers/getNextAction.worker.ts",
              import.meta.url
            ),
            { type: "module" }
          )
        );
      }
    },
    [
      actionOnDeck,
      aiAction,
      dispatch,
      game,
      gameState,
      player,
      playerIndex,
      worker,
    ]
  );

  const onCancelClick = () => {
    if (actionOnDeck.type === "none" || !player.isHuman) return;
    dispatch(cancelAllPrep());
  };

  const onAiActionClick = () => {
    if (!aiAction) return;
    if (aiAction.type === "none") return;
    if (!player.isHuman) return;
    dispatch(setActionOnDeck(aiAction));
  };

  const rotateCard = useCallback(() => {
    if (actionOnDeck.type === "buy" || actionOnDeck.type === "reserve") {
      const coinCost = canAffordCard(player, actionOnDeck.card);
      if (actionOnDeck.type === "buy") {
        dispatch(
          prepReserveCard({
            card: actionOnDeck.card,
            takeYellow: !!game.coins[Color.Yellow],
          })
        );
      } else if (actionOnDeck.type === "reserve" && coinCost) {
        dispatch(prepBuyCard({ card: actionOnDeck.card, coinCost }));
      }
    }
  }, [actionOnDeck.card, actionOnDeck.type, dispatch, game.coins, player]);

  useEffect(() => {
    // When the depth hits 2 and it's an AIs turn, play that action.
    if (depth >= 2 && !game.players[getPlayerIndex(game)].isHuman) {
      onTakeActionClick();
      return;
    }
    if (depth >= 2) return;
    worker.postMessage({ game, depth: depth + 1 });
    actionPool.start();
    console.log(getPossibleActions(game).map((a) => a.type));
    actionPool.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker, depth, dispatch]);

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

  const coinCost =
    actionOnDeck.card && canAffordCard(player, actionOnDeck.card);

  if (actionOnDeck.type === "none" && aiAction?.type === "none") return null;

  return (
    <MuiCard className={classes.onDeckContainer}>
      <Flex>
        <DisplayAction
          action={actionOnDeck}
          onCardClick={onCardClick}
          onCoinClick={onCoinClick}
        />
        {(actionOnDeck.type === "buy" ||
          (actionOnDeck.type === "reserve" && coinCost)) && (
          <IconButton onClick={rotateCard}>
            <Rotate90DegreesCcw />
          </IconButton>
        )}
      </Flex>
      <div>
        <ButtonGroup>
          <Button
            className={classes.takeActionButton}
            onClick={() => player.isHuman && onTakeActionClick()}
            disabled={
              (actionOnDeck.type === "none" && !aiAction) ||
              gameState !== "play" ||
              (actionOnDeck.type === "takeCoins" &&
                -getNumCoins(actionOnDeck.coinCost) <
                  Math.min(
                    3,
                    _.filter(
                      game.coins,
                      (count, color) => color !== "yellow" && !!count
                    ).length
                  ) &&
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
