import { makeStyles } from "tss-react/mui";
import {
  Button,
  ButtonGroup,
  IconButton,
  Card as MuiCard,
} from "@mui/material";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { Action, Color, Game } from "../../models/Splendor";
import { useActionOnDeck, useGame, useGameState } from "../../redux/selectors";
import {
  actionOnDeckSlice,
  cancelAllPrep,
  prepBuyCard,
  prepReserveCard,
  setActionOnDeck,
  unPrepBuyCard,
  unPrepBuyReserveCard,
  unPrepCoin,
  unPrepReserveCard,
} from "../../redux/slices/actionOnDeck";
import { Card, CardProps } from "./Card";
import { Coin, CoinProps } from "./Coin";
import { takeActionAction } from "../../redux/slices/game";
import {
  canAffordCard,
  getNumCoins,
  getPlayerIndex,
  getStrategy,
  needsNobleChoice,
  Strategy,
} from "../../utils/splendor";
import classNames from "classnames";
import { setGameState } from "../../redux/slices/gameState";
import { State } from "../../redux/rootReducer";
import { Close, Rotate90DegreesCcw } from "@mui/icons-material";
import { Flex } from "../Flex";
import { EMPTY_COINS } from "../../constants/utils";
import {
  GetNextActionRequest,
  GetNextActionResponse,
  MAX_AI_DEPTH,
} from "../../webWorkers/getNextAction.types";

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

/** How many times a crashing worker is respawned before we give up on it. */
const MAX_WORKER_RESTARTS = 3;

const createAiWorker = () =>
  new Worker(
    new URL("../../webWorkers/getNextAction.worker.ts", import.meta.url),
    { type: "module" }
  );

/**
 * Any legal move beats a stuck game, so an AI turn that the worker couldn't answer
 * falls back to the main thread. Taking no coins is legal and always available.
 */
const getFallbackAction = (game: Game): Action =>
  getStrategy(Strategy.Random)(game) ?? {
    type: "takeCoins",
    coinCost: { ...EMPTY_COINS },
    card: null,
  };

type AiResult = {
  /** The turn this was computed for. A result for any other turn is stale. */
  turn: number;
  depth: number;
  action: State["actionOnDeck"] | null;
};

type OnDeckProps = {};
export const OnDeck: VFC<OnDeckProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const gameState = useGameState();
  const [aiResult, setAiResult] = useState<AiResult>(() => ({
    turn: game.turn,
    depth: 0,
    action: actionOnDeckSlice.getInitialState(),
  }));
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerGeneration, setWorkerGeneration] = useState(0);
  const [workerIsBroken, setWorkerIsBroken] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestRef = useRef({ id: 0, turn: game.turn });
  const restartCountRef = useRef(0);
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];
  const dispatch = useDispatch();

  // Deriving these from the turn means a turn change always invalidates the old
  // search instead of leaving a suggestion from the previous position on screen.
  const hasCurrentResult = aiResult.turn === game.turn;
  const aiAction = hasCurrentResult ? aiResult.action : null;
  const depth = hasCurrentResult ? aiResult.depth : 0;

  const replaceWorker = useCallback(() => {
    // Bumping the id first makes any reply still in flight from the old worker stale.
    pendingRequestRef.current = {
      id: pendingRequestRef.current.id + 1,
      turn: -1,
    };
    setIsSearching(false);
    // A worker we've given up on stays dead; the main thread picks moves from here.
    if (workerIsBroken) return;
    setWorkerGeneration((generation) => generation + 1);
  }, [workerIsBroken]);

  const onCardClick = () => {
    if (!player.isHuman) return;
    if (!actionOnDeck.card) return;
    if (actionOnDeck.type === "buy") {
      dispatch(unPrepBuyCard());
    } else if (actionOnDeck.type === "reserve") {
      dispatch(unPrepReserveCard());
    } else if (actionOnDeck.type === "buyReserve") {
      dispatch(unPrepBuyReserveCard());
    }
  };

  const onCoinClick = (color: Color) => {
    if (!player.isHuman) return;
    if (color === Color.Yellow) return;
    if (!actionOnDeck.coinCost[color]) return;
    dispatch(unPrepCoin(color));
  };

  const takeTurnAction = useCallback(
    (overrideAction?: State["actionOnDeck"]) => {
      const actionToTake =
        overrideAction ??
        (actionOnDeck.type === "none" && !!aiAction ? aiAction : actionOnDeck);
      // Bail out before touching the worker. Terminating it here and then
      // returning left a dead worker in state that nothing ever replaced.
      if (actionToTake.type === "none") return;

      const needToChooseCoins =
        getNumCoins(player.coins) - getNumCoins(actionToTake.coinCost) > 10;
      const needToChooseNoble = needsNobleChoice(game, player, actionToTake);
      dispatch(
        takeActionAction({
          ...actionToTake,
          dontAdvance: needToChooseNoble || needToChooseCoins,
          popNoble: needToChooseNoble,
          playerIndex,
        })
      );
      dispatch(
        setGameState(
          needToChooseCoins
            ? "chooseCoins"
            : needToChooseNoble
            ? "chooseNobles"
            : "play"
        )
      );
      // Whatever the worker is computing now describes a position we just left.
      replaceWorker();
    },
    [
      actionOnDeck,
      aiAction,
      dispatch,
      game,
      player,
      playerIndex,
      replaceWorker,
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

  // One effect owns each worker's whole lifetime, so the worker it terminates is
  // always the one it created. Nothing gets orphaned and nothing is left dead in state.
  useEffect(() => {
    const aiWorker = createAiWorker();
    aiWorker.onmessage = (e: MessageEvent<GetNextActionResponse>) => {
      const response = e.data;
      // Only the reply to the request we're currently waiting on is meaningful.
      // Anything else came from a worker or a turn we already moved on from.
      if (response.requestId !== pendingRequestRef.current.id) return;
      restartCountRef.current = 0;
      setIsSearching(false);
      if (response.error) {
        console.error("AI search failed:", response.error);
      }
      setAiResult({
        turn: pendingRequestRef.current.turn,
        depth: response.depth,
        action: response.action,
      });
    };
    aiWorker.onerror = (event) => {
      event.preventDefault();
      console.error("AI worker crashed:", event.message || event);
      setIsSearching(false);
      pendingRequestRef.current = {
        id: pendingRequestRef.current.id + 1,
        turn: -1,
      };
      if (restartCountRef.current >= MAX_WORKER_RESTARTS) {
        // Respawning into the same crash just burns CPU; play from the main thread.
        setWorkerIsBroken(true);
        return;
      }
      restartCountRef.current++;
      setWorkerGeneration((generation) => generation + 1);
    };
    workerRef.current = aiWorker;
    setWorker(aiWorker);
    return () => {
      aiWorker.terminate();
      if (workerRef.current === aiWorker) workerRef.current = null;
    };
  }, [workerGeneration]);

  useEffect(() => {
    // Skip the render where `worker` still points at a worker we just replaced.
    if (!worker || worker !== workerRef.current) return;
    if (gameState !== "play") return;
    if (workerIsBroken) return;
    if (depth >= MAX_AI_DEPTH) return;
    pendingRequestRef.current = {
      id: pendingRequestRef.current.id + 1,
      turn: game.turn,
    };
    const request: GetNextActionRequest = {
      game,
      depth: depth + 1,
      requestId: pendingRequestRef.current.id,
    };
    setIsSearching(true);
    worker.postMessage(request);
    // `game` is a new object on every dispatch, so the turn is what should restart
    // the search. Depending on `game` itself would repost on every unrelated change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker, depth, gameState, game.turn, workerIsBroken]);

  useEffect(() => {
    if (gameState !== "play") return;
    if (player.isHuman) return;
    // Wait for the full search, unless the worker is out of the picture entirely.
    if (!workerIsBroken && depth < MAX_AI_DEPTH) return;
    const searchedAction =
      aiAction && aiAction.type !== "none" ? aiAction : null;
    // A search that came back empty must not stall the game.
    takeTurnAction(searchedAction ?? getFallbackAction(game));
  }, [
    aiAction,
    depth,
    game,
    gameState,
    player.isHuman,
    takeTurnAction,
    workerIsBroken,
  ]);

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
        {((actionOnDeck.type === "buy" && player.reserved.length < 3) ||
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
            onClick={() => player.isHuman && takeTurnAction()}
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
      ) : workerIsBroken ? (
        "AI unavailable."
      ) : isSearching ? (
        "Thinking..."
      ) : (
        "No AI Action."
      )}
    </MuiCard>
  );
};
