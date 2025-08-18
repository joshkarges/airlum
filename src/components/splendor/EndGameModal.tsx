import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
import _ from "lodash";
import { useCallback, useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { useGame } from "../../redux/selectors";
import { getPlayerIndex } from "../../utils/splendor";
import { oxfordCommaList } from "../../utils/utils";
import {
  useFetchedResource,
  useSelectorWithPrefix,
} from "../../utils/fetchers";
import { writeSplendorGame } from "../../api/SplendorApi";
import { endGameRecord } from "../../redux/slices/gameRecord";
import { FetchedComponent } from "../fetchers/FetchedComponent";
import { setShowGameSetup } from "../../redux/slices/showGameSetup";
import { Flex } from "../Flex";
import moment from "moment";
import { setGameState } from "../../redux/slices/gameState";

type EndGameModalProps = {};
export const EndGameModal: VFC<EndGameModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const game = useGame();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  const gameRecord = useSelectorWithPrefix("gameRecord");
  const [writeResponse, sendGameToServer] =
    useFetchedResource(writeSplendorGame);
  const mostPoints = game.players.reduce((agg, player, i) => {
    if (player.points >= agg) {
      agg = player.points;
    }
    return agg;
  }, 0);
  const playerIndicesWithMostPoints = _.range(0, game.players.length).filter(
    (i) => game.players[i].points === mostPoints
  );
  const isGameOver =
    playerIndex === game.startingPlayerIndex && mostPoints >= 15;
  const [needToSendRecord, setNeedToSendRecord] = useState(false);

  const closeAndStartNewGame = useCallback(() => {
    setIsOpen(false);
    dispatch(setShowGameSetup(true));
    dispatch(setGameState("play"));
  }, [dispatch]);

  useEffect(() => {
    if (isGameOver) {
      setIsOpen(true);
      dispatch(endGameRecord(game));
      dispatch(setGameState("endGame"));
      setNeedToSendRecord(true);
    }
  }, [dispatch, game, isGameOver]);

  useEffect(() => {
    if (needToSendRecord) {
      sendGameToServer(gameRecord);
      setNeedToSendRecord(false);
    }
  }, [needToSendRecord, gameRecord, sendGameToServer]);

  return (
    <Dialog open={isOpen && isGameOver} onClose={closeAndStartNewGame}>
      <DialogTitle>{`${oxfordCommaList(
        playerIndicesWithMostPoints.map((idx) =>
          idx === 0 ? "You" : `Player #${idx}`
        )
      )} Won! (${
        (game.turn - game.startingPlayerIndex) / game.players.length
      } moves)`}</DialogTitle>
      <DialogContent>
        {moment
          .utc(
            moment
              .duration(gameRecord.endTime - gameRecord.startTime)
              .asMilliseconds()
          )
          .format("mm:ss")}{" "}
        elapsed
      </DialogContent>
      <FetchedComponent resource={writeResponse}>
        {(data) => <div>{`Recorded game: ${data}`}</div>}
      </FetchedComponent>
      <Flex justifyContent="space-between">
        <Button onClick={closeAndStartNewGame}>Start New Game</Button>
        <Button onClick={() => (window.location.href = "/splendor-stats")}>
          Go To Stats
        </Button>
      </Flex>
    </Dialog>
  );
};
